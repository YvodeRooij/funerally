import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireAuth,
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
  ApiError,
  validateRequiredFields,
  getUserProfile,
  sendNotification
} from "@/lib/api-utils";
import { ShareDocumentRequest } from "@/types/api";

async function POST(request: NextRequest) {
  const session = await requireAuth(request);
  const body: ShareDocumentRequest = await request.json();
  
  validateRequiredFields(body, ["document_id", "share_with"]);

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Get document
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", body.document_id)
    .single();

  if (docError || !document) {
    throw new ApiError("Document not found", 404);
  }

  // Check if user has permission to share this document
  const canShare = 
    document.owner_id === profile.id || 
    document.shared_with.includes(profile.id);

  if (!canShare) {
    throw new ApiError("Access denied - cannot share this document", 403);
  }

  // Validate users to share with
  const { data: validUsers, error: usersError } = await supabase
    .from("user_profiles")
    .select("id, name, email, user_type")
    .in("id", body.share_with);

  if (usersError || !validUsers || validUsers.length !== body.share_with.length) {
    throw new ApiError("Invalid users in share_with list", 400);
  }

  // Filter out users who already have access
  const currentSharedWith = document.shared_with || [];
  const newUsersToShare = body.share_with.filter(
    (userId: string) => !currentSharedWith.includes(userId) && userId !== document.owner_id
  );

  if (newUsersToShare.length === 0) {
    return createSuccessResponse(
      { already_shared: true },
      "All specified users already have access to this document"
    );
  }

  // Update document shared_with array
  const updatedSharedWith = [...new Set([...currentSharedWith, ...newUsersToShare])];
  
  const { error: updateError } = await supabase
    .from("documents")
    .update({
      shared_with: updatedSharedWith,
      updated_at: new Date().toISOString()
    })
    .eq("id", body.document_id);

  if (updateError) {
    throw new ApiError("Failed to update document sharing", 500);
  }

  // Create sharing records for new users
  const shareRecords = newUsersToShare.map((userId: string) => ({
    document_id: body.document_id,
    shared_with: userId,
    shared_by: profile.id,
    shared_at: new Date().toISOString(),
    message: body.message || null
  }));

  const { error: shareError } = await supabase
    .from("document_shares")
    .insert(shareRecords);

  if (shareError) {
    throw new ApiError("Failed to create share records", 500);
  }

  // Send notifications to newly shared users
  const newSharedUsers = validUsers.filter(user => 
    newUsersToShare.includes(user.id)
  );

  for (const user of newSharedUsers) {
    const notificationMessage = body.message 
      ? `${profile.name} shared a document with you: "${document.title}". Message: ${body.message}`
      : `${profile.name} shared a document with you: "${document.title}"`;

    await sendNotification(
      user.id,
      "document",
      "Document Shared",
      notificationMessage,
      { 
        document_id: body.document_id,
        shared_by: profile.name,
        shared_by_id: profile.id,
        document_title: document.title,
        document_type: document.type,
        share_message: body.message
      }
    );
  }

  // Get updated document with sharing details
  const { data: updatedDocument } = await supabase
    .from("documents")
    .select(`
      *,
      owner:user_profiles!documents_owner_id_fkey(id, name, email),
      shared_with_details:document_shares!document_shares_document_id_fkey(
        shared_with:user_profiles!document_shares_shared_with_fkey(id, name, email, user_type),
        shared_by:user_profiles!document_shares_shared_by_fkey(id, name, email),
        shared_at, message
      )
    `)
    .eq("id", body.document_id)
    .single();

  return createSuccessResponse({
    document: updatedDocument,
    newly_shared_with: newSharedUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      user_type: user.user_type
    })),
    total_shares: updatedSharedWith.length
  }, `Document shared successfully with ${newUsersToShare.length} new user(s)`);
}

async function DELETE(request: NextRequest) {
  const session = await requireAuth(request);
  const body = await request.json();
  
  validateRequiredFields(body, ["document_id", "revoke_from"]);

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Get document
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", body.document_id)
    .single();

  if (docError || !document) {
    throw new ApiError("Document not found", 404);
  }

  // Check if user has permission to revoke sharing
  if (document.owner_id !== profile.id) {
    throw new ApiError("Access denied - only owner can revoke sharing", 403);
  }

  // Validate users to revoke from
  const usersToRevoke = Array.isArray(body.revoke_from) ? body.revoke_from : [body.revoke_from];
  
  const { data: validUsers, error: usersError } = await supabase
    .from("user_profiles")
    .select("id, name, email")
    .in("id", usersToRevoke);

  if (usersError || !validUsers || validUsers.length !== usersToRevoke.length) {
    throw new ApiError("Invalid users in revoke_from list", 400);
  }

  // Update document shared_with array
  const currentSharedWith = document.shared_with || [];
  const updatedSharedWith = currentSharedWith.filter(
    (userId: string) => !usersToRevoke.includes(userId)
  );
  
  const { error: updateError } = await supabase
    .from("documents")
    .update({
      shared_with: updatedSharedWith,
      updated_at: new Date().toISOString()
    })
    .eq("id", body.document_id);

  if (updateError) {
    throw new ApiError("Failed to update document sharing", 500);
  }

  // Remove sharing records
  const { error: deleteError } = await supabase
    .from("document_shares")
    .delete()
    .eq("document_id", body.document_id)
    .in("shared_with", usersToRevoke);

  if (deleteError) {
    console.error("Failed to delete share records:", deleteError);
    // Don't fail the request if this fails
  }

  // Send notifications to users whose access was revoked
  for (const user of validUsers) {
    await sendNotification(
      user.id,
      "document",
      "Document Access Revoked",
      `${profile.name} has revoked your access to document: "${document.title}"`,
      { 
        document_id: body.document_id,
        revoked_by: profile.name,
        document_title: document.title
      }
    );
  }

  return createSuccessResponse({
    revoked_from: validUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email
    })),
    remaining_shares: updatedSharedWith.length
  }, `Document access revoked from ${usersToRevoke.length} user(s)`);
}

export const POST_Handler = withErrorHandling(POST);
export const DELETE_Handler = withErrorHandling(DELETE);
export { POST_Handler as POST, DELETE_Handler as DELETE };