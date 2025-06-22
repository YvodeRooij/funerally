import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireAuth,
  requireUserType,
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
  ApiError,
  getUserProfile,
  decryptData,
  sendNotification
} from "@/lib/api-utils";

async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUserType(request, ["family"]);
  const { id } = await params;
  const documentId = id;
  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download") === "true";

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Get document metadata
  const { data: document, error } = await supabase
    .from("documents")
    .select(`
      *,
      owner:user_profiles!documents_owner_id_fkey(id, name, email)
    `)
    .eq("id", documentId)
    .single();

  if (error || !document) {
    throw new ApiError("Document not found", 404);
  }

  // Check if user has access to this document
  const hasAccess = 
    document.owner_id === profile.id || 
    document.shared_with.includes(profile.id);

  if (!hasAccess) {
    throw new ApiError("Access denied", 403);
  }

  if (download) {
    // Get signed URL for file download
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.file_path, 3600); // 1 hour expiry

    if (urlError) {
      throw new ApiError("Failed to generate download URL", 500);
    }

    return createSuccessResponse({
      ...document,
      download_url: signedUrlData.signedUrl
    });
  }

  return createSuccessResponse(document);
}

async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUserType(request, ["family"]);
  const { id } = await params;
  const documentId = id;
  const body = await request.json();

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Get existing document
  const { data: existingDocument, error: fetchError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (fetchError || !existingDocument) {
    throw new ApiError("Document not found", 404);
  }

  // Check if user owns this document
  if (existingDocument.owner_id !== profile.id) {
    throw new ApiError("Access denied - only owner can modify document", 403);
  }

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  // Only update provided fields
  if (body.title !== undefined) updateData.title = body.title;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.shared_with !== undefined) updateData.shared_with = body.shared_with;

  const { data: document, error } = await supabase
    .from("documents")
    .update(updateData)
    .eq("id", documentId)
    .select()
    .single();

  if (error) {
    throw new ApiError("Failed to update document", 500);
  }

  // Send notifications to newly shared users
  if (body.shared_with && Array.isArray(body.shared_with)) {
    const newlyShared = body.shared_with.filter(
      (userId: string) => !existingDocument.shared_with.includes(userId)
    );

    for (const userId of newlyShared) {
      await sendNotification(
        userId,
        "document",
        "Document Shared",
        `${profile.name} shared a document: ${document.title}`,
        { document_id: document.id }
      );
    }
  }

  return createSuccessResponse(document, "Document updated successfully");
}

async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUserType(request, ["family"]);
  const { id } = await params;
  const documentId = id;

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Get existing document
  const { data: existingDocument, error: fetchError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (fetchError || !existingDocument) {
    throw new ApiError("Document not found", 404);
  }

  // Check if user owns this document
  if (existingDocument.owner_id !== profile.id) {
    throw new ApiError("Access denied - only owner can delete document", 403);
  }

  // Delete file from storage
  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([existingDocument.file_path]);

  if (storageError) {
    console.error("Failed to delete file from storage:", storageError);
    // Continue with database deletion even if storage deletion fails
  }

  // Delete document record
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (error) {
    throw new ApiError("Failed to delete document", 500);
  }

  return createSuccessResponse(null, "Document deleted successfully");
}

export const GET_Handler = withErrorHandling(GET);
export const PUT_Handler = withErrorHandling(PUT);
export const DELETE_Handler = withErrorHandling(DELETE);
export { GET_Handler as GET, PUT_Handler as PUT, DELETE_Handler as DELETE };