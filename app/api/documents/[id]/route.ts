import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireAuth,
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
  { params }: { params: { id: string } }
) {
  const session = await requireAuth(request);
  const documentId = params.id;
  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download") === "true";
  const view = searchParams.get("view") === "true";

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Get document metadata
  const { data: document, error } = await supabase
    .from("documents")
    .select(`
      *,
      owner:user_profiles!documents_owner_id_fkey(id, name, email, user_type),
      shared_with_details:document_shares!document_shares_document_id_fkey(
        shared_with:user_profiles!document_shares_shared_with_fkey(id, name, email),
        shared_by:user_profiles!document_shares_shared_by_fkey(id, name, email),
        shared_at, message
      ),
      booking_associations:booking_documents!booking_documents_document_id_fkey(
        booking:bookings(id, service_type, date, status, family_id, director_id, venue_id)
      )
    `)
    .eq("id", documentId)
    .single();

  if (error || !document) {
    throw new ApiError("Document not found", 404);
  }

  // Check if user has access to this document
  const hasDirectAccess = 
    document.owner_id === profile.id || 
    document.shared_with.includes(profile.id);

  // Check if user has access through booking association
  let hasBookingAccess = false;
  if (document.booking_associations && document.booking_associations.length > 0) {
    hasBookingAccess = document.booking_associations.some((assoc: any) => {
      const booking = assoc.booking;
      return booking.family_id === profile.id ||
             booking.director_id === profile.id ||
             booking.venue_id === profile.id;
    });
  }

  if (!hasDirectAccess && !hasBookingAccess) {
    throw new ApiError("Access denied", 403);
  }

  // Log document access
  await supabase
    .from("document_access_log")
    .insert({
      document_id: documentId,
      accessed_by: profile.id,
      access_type: download ? "download" : view ? "view" : "metadata",
      accessed_at: new Date().toISOString()
    });

  if (download || view) {
    // Get signed URL for file access
    const expiresIn = download ? 3600 : 1800; // 1 hour for download, 30 min for view
    
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.file_path, expiresIn);

    if (urlError) {
      throw new ApiError("Failed to generate access URL", 500);
    }

    // If document is encrypted and user wants to download/view
    let decryptionInfo = null;
    if (document.is_encrypted && document.encryption_key) {
      // Only provide decryption info to authorized users
      if (document.owner_id === profile.id) {
        decryptionInfo = {
          is_encrypted: true,
          encryption_key: document.encryption_key
        };
      } else {
        // For shared users, we might provide decrypted content or limited access
        decryptionInfo = {
          is_encrypted: true,
          requires_decryption: true
        };
      }
    }

    return createSuccessResponse({
      ...document,
      access_url: signedUrlData.signedUrl,
      decryption_info: decryptionInfo,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString()
    });
  }

  return createSuccessResponse(document);
}

async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth(request);
  const documentId = params.id;
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

  // Check if user can modify this document
  if (existingDocument.owner_id !== profile.id) {
    throw new ApiError("Access denied - only owner can modify document", 403);
  }

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  // Only update provided fields
  if (body.title !== undefined) updateData.title = body.title;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.description !== undefined) updateData.description = body.description;

  // Handle sharing updates
  if (body.shared_with !== undefined) {
    // Validate users to share with
    if (body.shared_with.length > 0) {
      const { data: validUsers, error: usersError } = await supabase
        .from("user_profiles")
        .select("id")
        .in("id", body.shared_with);

      if (usersError || !validUsers || validUsers.length !== body.shared_with.length) {
        throw new ApiError("Invalid users in share_with list", 400);
      }
    }

    updateData.shared_with = body.shared_with;

    // Update document_shares table
    // First, remove existing shares
    await supabase
      .from("document_shares")
      .delete()
      .eq("document_id", documentId);

    // Then add new shares
    if (body.shared_with.length > 0) {
      const shareRecords = body.shared_with.map((userId: string) => ({
        document_id: documentId,
        shared_with: userId,
        shared_by: profile.id,
        shared_at: new Date().toISOString(),
        message: body.share_message || null
      }));

      await supabase
        .from("document_shares")
        .insert(shareRecords);

      // Send notifications to newly shared users
      const newlyShared = body.shared_with.filter(
        (userId: string) => !existingDocument.shared_with.includes(userId)
      );

      for (const userId of newlyShared) {
        await sendNotification(
          userId,
          "document",
          "Document Shared",
          `${profile.name} shared a document with you: ${existingDocument.title}`,
          { 
            document_id: documentId,
            shared_by: profile.name,
            document_title: existingDocument.title,
            share_message: body.share_message
          }
        );
      }
    }
  }

  const { data: document, error } = await supabase
    .from("documents")
    .update(updateData)
    .eq("id", documentId)
    .select(`
      *,
      owner:user_profiles!documents_owner_id_fkey(id, name, email)
    `)
    .single();

  if (error) {
    throw new ApiError("Failed to update document", 500);
  }

  return createSuccessResponse(document, "Document updated successfully");
}

async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth(request);
  const documentId = params.id;

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

  // Check if user can delete this document
  if (existingDocument.owner_id !== profile.id) {
    throw new ApiError("Access denied - only owner can delete document", 403);
  }

  // Check if document is associated with active bookings
  const { data: activeBookingAssociations } = await supabase
    .from("booking_documents")
    .select(`
      booking:bookings(id, status)
    `)
    .eq("document_id", documentId);

  const hasActiveBookings = activeBookingAssociations?.some((assoc: any) => 
    ["pending", "confirmed"].includes(assoc.booking.status)
  );

  if (hasActiveBookings) {
    throw new ApiError(
      "Cannot delete document associated with active bookings. Complete or cancel bookings first.",
      400
    );
  }

  // Delete file from storage
  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([existingDocument.file_path]);

  if (storageError) {
    console.error("Failed to delete file from storage:", storageError);
    // Continue with database deletion even if storage deletion fails
  }

  // Delete related records first (foreign key constraints)
  await supabase
    .from("document_shares")
    .delete()
    .eq("document_id", documentId);

  await supabase
    .from("booking_documents")
    .delete()
    .eq("document_id", documentId);

  await supabase
    .from("document_access_log")
    .delete()
    .eq("document_id", documentId);

  // Delete document record
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (error) {
    throw new ApiError("Failed to delete document", 500);
  }

  // Notify users who had shared access
  if (existingDocument.shared_with && existingDocument.shared_with.length > 0) {
    for (const userId of existingDocument.shared_with) {
      await sendNotification(
        userId,
        "document",
        "Shared Document Deleted",
        `${profile.name} has deleted a document that was shared with you: ${existingDocument.title}`,
        { 
          document_title: existingDocument.title,
          deleted_by: profile.name
        }
      );
    }
  }

  return createSuccessResponse(null, "Document deleted successfully");
}

export { 
  withErrorHandling(GET) as GET,
  withErrorHandling(PUT) as PUT,
  withErrorHandling(DELETE) as DELETE
};