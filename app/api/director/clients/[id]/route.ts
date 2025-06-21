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
  sendNotification
} from "@/lib/api-utils";

async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireUserType(request, ["director"]);
  const clientId = params.id;

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  const { data: client, error } = await supabase
    .from("director_clients")
    .select(`
      *,
      family:user_profiles!director_clients_family_id_fkey(
        id, name, email, phone, address, emergency_contact, family_code, preferences
      ),
      bookings:bookings!bookings_director_id_fkey(
        id, service_type, date, time, duration, status, price, notes, created_at,
        venue:user_profiles!bookings_venue_id_fkey(id, name, venue_name, address),
        payments(*)
      ),
      shared_documents:document_shares!document_shares_shared_with_fkey(
        document:documents(id, title, type, created_at, file_size)
      ),
      chat_rooms:chat_participants(
        room:chat_rooms(id, type, title, updated_at,
          last_message:chat_messages!chat_messages_room_id_fkey(
            id, message, message_type, created_at,
            sender:user_profiles!chat_messages_sender_id_fkey(id, name)
          )
        )
      )
    `)
    .eq("id", clientId)
    .eq("director_id", profile.id)
    .single();

  if (error || !client) {
    throw new ApiError("Client not found", 404);
  }

  // Get booking statistics
  const { data: bookingStats } = await supabase
    .from("bookings")
    .select("status, price")
    .eq("director_id", profile.id)
    .eq("family_id", client.family_id);

  const stats = {
    total_bookings: bookingStats?.length || 0,
    completed_bookings: bookingStats?.filter(b => b.status === "completed").length || 0,
    pending_bookings: bookingStats?.filter(b => b.status === "pending").length || 0,
    cancelled_bookings: bookingStats?.filter(b => b.status === "cancelled").length || 0,
    total_revenue: bookingStats?.reduce((sum, b) => sum + (b.price || 0), 0) || 0,
    average_booking_value: bookingStats?.length 
      ? (bookingStats.reduce((sum, b) => sum + (b.price || 0), 0) / bookingStats.length)
      : 0
  };

  // Get recent activity
  const { data: recentActivity } = await supabase
    .from("bookings")
    .select("id, service_type, date, status, created_at")
    .eq("director_id", profile.id)
    .eq("family_id", client.family_id)
    .order("created_at", { ascending: false })
    .limit(5);

  return createSuccessResponse({
    ...client,
    booking_stats: stats,
    recent_activity: recentActivity || []
  });
}

async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireUserType(request, ["director"]);
  const clientId = params.id;
  const body = await request.json();

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Get existing client
  const { data: existingClient, error: fetchError } = await supabase
    .from("director_clients")
    .select("*")
    .eq("id", clientId)
    .eq("director_id", profile.id)
    .single();

  if (fetchError || !existingClient) {
    throw new ApiError("Client not found", 404);
  }

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  // Only update provided fields
  if (body.relationship_status !== undefined) {
    updateData.relationship_status = body.relationship_status;
  }
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.tags !== undefined) updateData.tags = body.tags;

  const { data: client, error } = await supabase
    .from("director_clients")
    .update(updateData)
    .eq("id", clientId)
    .eq("director_id", profile.id)
    .select(`
      *,
      family:user_profiles!director_clients_family_id_fkey(
        id, name, email, phone, address
      )
    `)
    .single();

  if (error) {
    throw new ApiError("Failed to update client", 500);
  }

  // Send notification if relationship status changed
  if (body.relationship_status && body.relationship_status !== existingClient.relationship_status) {
    const statusMessages = {
      active: "Your relationship with the director has been activated",
      inactive: "Your relationship with the director has been deactivated",
      archived: "Your relationship with the director has been archived"
    };

    await sendNotification(
      existingClient.family_id,
      "system",
      "Relationship Status Updated",
      statusMessages[body.relationship_status as keyof typeof statusMessages] || 
      "Your relationship status has been updated",
      { 
        director_id: profile.id, 
        client_id: clientId, 
        new_status: body.relationship_status 
      }
    );
  }

  return createSuccessResponse(client, "Client updated successfully");
}

async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireUserType(request, ["director"]);
  const clientId = params.id;

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Get existing client
  const { data: existingClient, error: fetchError } = await supabase
    .from("director_clients")
    .select("*")
    .eq("id", clientId)
    .eq("director_id", profile.id)
    .single();

  if (fetchError || !existingClient) {
    throw new ApiError("Client not found", 404);
  }

  // Check if there are active bookings
  const { data: activeBookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("director_id", profile.id)
    .eq("family_id", existingClient.family_id)
    .in("status", ["pending", "confirmed"]);

  if (activeBookings && activeBookings.length > 0) {
    throw new ApiError(
      "Cannot remove client with active bookings. Cancel or complete bookings first.",
      400
    );
  }

  // Soft delete - archive the relationship instead of hard delete
  const { data: client, error } = await supabase
    .from("director_clients")
    .update({
      relationship_status: "archived",
      updated_at: new Date().toISOString()
    })
    .eq("id", clientId)
    .eq("director_id", profile.id)
    .select()
    .single();

  if (error) {
    throw new ApiError("Failed to archive client relationship", 500);
  }

  // Send notification to family
  await sendNotification(
    existingClient.family_id,
    "system",
    "Director Relationship Ended",
    `${profile.name} has ended the professional relationship. Your booking history is preserved.`,
    { director_id: profile.id, client_id: clientId }
  );

  return createSuccessResponse(client, "Client relationship archived successfully");
}

export { 
  withErrorHandling(GET) as GET,
  withErrorHandling(PUT) as PUT,
  withErrorHandling(DELETE) as DELETE
};