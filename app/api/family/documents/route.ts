import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireAuth,
  requireUserType,
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
  ApiError,
  validateRequiredFields,
  parsePaginationParams,
  createPaginationInfo,
  getUserProfile,
  generateEncryptionKey,
  encryptData,
  validateFileType,
  validateFileSize,
  sendNotification
} from "@/lib/api-utils";
import { UploadDocumentRequest, ShareDocumentRequest } from "@/types/api";

async function GET(request: NextRequest) {
  const session = await requireUserType(request, ["family"]);
  const { page, limit } = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const type = searchParams.get("type");
  const shared = searchParams.get("shared") === "true";
  const search = searchParams.get("search");

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  let query = supabase
    .from("documents")
    .select(`
      *,
      shared_by:document_shares!document_shares_document_id_fkey(
        shared_by:user_profiles!document_shares_shared_by_fkey(id, name, email)
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false });

  if (shared) {
    // Get documents shared with this family
    query = query.contains("shared_with", [profile.id]);
  } else {
    // Get documents owned by this family
    query = query.eq("owner_id", profile.id);
  }

  // Apply filters
  if (type) {
    query = query.eq("type", type);
  }
  
  if (search) {
    query = query.or(`title.ilike.%${search}%,type.ilike.%${search}%`);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: documents, error, count } = await query;

  if (error) {
    throw new ApiError("Failed to fetch documents", 500);
  }

  const pagination = createPaginationInfo(page, limit, count || 0);

  return createSuccessResponse(documents, "Documents retrieved successfully", pagination);
}

async function POST(request: NextRequest) {
  const session = await requireUserType(request, ["family"]);
  
  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;
    const encrypt = formData.get("encrypt") === "true";
    const shareWithString = formData.get("share_with") as string;
    const shareWith = shareWithString ? JSON.parse(shareWithString) : [];

    if (!file || !title || !type) {
      throw new ApiError("File, title, and type are required", 400);
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];

    if (!validateFileType(file.type, allowedTypes)) {
      throw new ApiError("File type not allowed", 400);
    }

    // Validate file size (10MB max)
    if (!validateFileSize(file.size, 10)) {
      throw new ApiError("File size exceeds 10MB limit", 400);
    }

    // Generate file path
    const fileExtension = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `documents/family/${profile.id}/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadError) {
      throw new ApiError("Failed to upload file", 500);
    }

    // Prepare document data
    let encryptionKey: string | undefined;
    let fileContent: string | undefined;

    if (encrypt) {
      encryptionKey = generateEncryptionKey();
      // For encryption, we'd typically encrypt the file content
      // This is a simplified example
      fileContent = encryptData(file.name, encryptionKey);
    }

    // Save document metadata
    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        title,
        type,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        owner_id: profile.id,
        owner_type: "family",
        is_encrypted: encrypt,
        encryption_key: encryptionKey,
        shared_with: shareWith,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Clean up uploaded file if database save fails
      await supabase.storage.from("documents").remove([filePath]);
      throw new ApiError("Failed to save document metadata", 500);
    }

    // Send notifications to shared users
    if (shareWith.length > 0) {
      for (const userId of shareWith) {
        await sendNotification(
          userId,
          "document",
          "Document Shared",
          `${profile.name} shared a document: ${title}`,
          { document_id: document.id }
        );
      }
    }

    return createSuccessResponse(document, "Document uploaded successfully");
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Failed to process file upload", 500);
  }
}

export { 
  withErrorHandling(GET) as GET,
  withErrorHandling(POST) as POST
};