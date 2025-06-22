import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireAuth,
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
  buildSearchQuery,
  sendNotification
} from "@/lib/api-utils";
import { UploadDocumentRequest } from "@/types/api";

async function GET(request: NextRequest) {
  const session = await requireAuth(request);
  const { page, limit } = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const type = searchParams.get("type");
  const shared = searchParams.get("shared") === "true";
  const search = searchParams.get("search");
  const bookingId = searchParams.get("booking_id");
  const sortBy = searchParams.get("sort_by") || "created_at";
  const sortOrder = searchParams.get("sort_order") || "desc";

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  let query = supabase
    .from("documents")
    .select(`
      *,
      owner:user_profiles!documents_owner_id_fkey(id, name, email, user_type),
      shared_with_users:document_shares!document_shares_document_id_fkey(
        shared_with:user_profiles!document_shares_shared_with_fkey(id, name, email),
        shared_by:user_profiles!document_shares_shared_by_fkey(id, name, email),
        shared_at, message
      ),
      booking:booking_documents!booking_documents_document_id_fkey(
        booking:bookings(id, service_type, date, status)
      )
    `, { count: "exact" })
    .order(sortBy, { ascending: sortOrder === "asc" });

  if (shared) {
    // Get documents shared with this user
    query = query.contains("shared_with", [profile.id]);
  } else {
    // Get documents owned by this user OR shared with them
    query = query.or(`owner_id.eq.${profile.id},shared_with.cs.{${profile.id}}`);
  }

  // Apply filters
  if (type) {
    query = query.eq("type", type);
  }
  
  if (search) {
    query = buildSearchQuery(query, search, ["title", "type"]);
  }

  if (bookingId) {
    // Get documents associated with a specific booking
    const { data: bookingDocs } = await supabase
      .from("booking_documents")
      .select("document_id")
      .eq("booking_id", bookingId);
    
    if (bookingDocs && bookingDocs.length > 0) {
      const docIds = bookingDocs.map(bd => bd.document_id);
      query = query.in("id", docIds);
    } else {
      // No documents for this booking
      return createSuccessResponse({
        documents: [],
        stats: { total: 0, owned: 0, shared: 0 }
      });
    }
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: documents, error, count } = await query;

  if (error) {
    throw new ApiError("Failed to fetch documents", 500);
  }

  // Calculate statistics
  const ownedDocs = documents?.filter(d => d.owner_id === profile.id).length || 0;
  const sharedDocs = documents?.filter(d => 
    d.owner_id !== profile.id && d.shared_with.includes(profile.id)
  ).length || 0;

  const stats = {
    total: count || 0,
    owned: ownedDocs,
    shared: sharedDocs
  };

  const pagination = createPaginationInfo(page, limit, count || 0);

  return createSuccessResponse({
    documents: documents || [],
    stats,
    filters: {
      type, shared, search, booking_id: bookingId,
      sort_by: sortBy, sort_order: sortOrder
    }
  }, "Documents retrieved successfully", pagination);
}

async function POST(request: NextRequest) {
  const session = await requireAuth(request);
  
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
    const bookingIdString = formData.get("booking_id") as string;
    const description = formData.get("description") as string;

    if (!file || !title || !type) {
      throw new ApiError("File, title, and type are required", 400);
    }

    // Parse share_with array
    let shareWith: string[] = [];
    if (shareWithString) {
      try {
        shareWith = JSON.parse(shareWithString);
      } catch {
        throw new ApiError("Invalid share_with format", 400);
      }
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png", 
      "image/gif",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv"
    ];

    if (!validateFileType(file.type, allowedTypes)) {
      throw new ApiError("File type not allowed", 400);
    }

    // Validate file size (25MB max)
    if (!validateFileSize(file.size, 25)) {
      throw new ApiError("File size exceeds 25MB limit", 400);
    }

    // Validate users to share with
    if (shareWith.length > 0) {
      const { data: validUsers, error: usersError } = await supabase
        .from("user_profiles")
        .select("id")
        .in("id", shareWith);

      if (usersError || !validUsers || validUsers.length !== shareWith.length) {
        throw new ApiError("Invalid users in share_with list", 400);
      }
    }

    // Validate booking if provided
    let bookingId: string | null = null;
    if (bookingIdString) {
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("id, family_id, director_id, venue_id")
        .eq("id", bookingIdString)
        .single();

      if (bookingError || !booking) {
        throw new ApiError("Booking not found", 404);
      }

      // Check if user has access to this booking
      const hasBookingAccess = 
        booking.family_id === profile.id ||
        booking.director_id === profile.id ||
        booking.venue_id === profile.id;

      if (!hasBookingAccess) {
        throw new ApiError("Access denied to booking", 403);
      }

      bookingId = bookingIdString;
    }

    // Generate file path
    const fileExtension = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `documents/${profile.user_type}/${profile.id}/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadError) {
      throw new ApiError("Failed to upload file", 500);
    }

    // Prepare document data
    let encryptionKey: string | undefined;
    
    if (encrypt) {
      encryptionKey = generateEncryptionKey();
    }

    // Save document metadata
    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        title,
        type,
        description,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        owner_id: profile.id,
        owner_type: profile.user_type,
        is_encrypted: encrypt,
        encryption_key: encryptionKey,
        shared_with: shareWith,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        owner:user_profiles!documents_owner_id_fkey(id, name, email)
      `)
      .single();

    if (error) {
      // Clean up uploaded file if database save fails
      await supabase.storage.from("documents").remove([filePath]);
      throw new ApiError("Failed to save document metadata", 500);
    }

    // Associate with booking if provided
    if (bookingId) {
      const { error: bookingDocError } = await supabase
        .from("booking_documents")
        .insert({
          booking_id: bookingId,
          document_id: document.id,
          uploaded_by: profile.id,
          created_at: new Date().toISOString()
        });

      if (bookingDocError) {
        console.error("Failed to associate document with booking:", bookingDocError);
        // Don't fail the entire request
      }
    }

    // Create sharing records
    if (shareWith.length > 0) {
      const shareRecords = shareWith.map(userId => ({
        document_id: document.id,
        shared_with: userId,
        shared_by: profile.id,
        shared_at: new Date().toISOString()
      }));

      const { error: shareError } = await supabase
        .from("document_shares")
        .insert(shareRecords);

      if (shareError) {
        console.error("Failed to create share records:", shareError);
        // Don't fail the entire request
      }

      // Send notifications to shared users
      for (const userId of shareWith) {
        await sendNotification(
          userId,
          "document",
          "Document Shared",
          `${profile.name} shared a document with you: ${title}`,
          { 
            document_id: document.id,
            shared_by: profile.name,
            document_title: title,
            document_type: type
          }
        );
      }
    }

    return createSuccessResponse(document, "Document uploaded successfully");
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error("Document upload error:", error);
    throw new ApiError("Failed to process file upload", 500);
  }
}

export const GET_Handler = withErrorHandling(GET);
export const POST_Handler = withErrorHandling(POST);
export { GET_Handler as GET, POST_Handler as POST };