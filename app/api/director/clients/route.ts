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
  buildSearchQuery,
  sendNotification
} from "@/lib/api-utils";
import { AddClientRequest } from "@/types/api";

async function GET(request: NextRequest) {
  const session = await requireUserType(request, ["director"]);
  const { page, limit } = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const tags = searchParams.get("tags");

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  let query = supabase
    .from("director_clients")
    .select(`
      *,
      family:user_profiles!director_clients_family_id_fkey(
        id, name, email, phone, address, emergency_contact
      ),
      recent_bookings:bookings!bookings_director_id_fkey(
        id, service_type, date, time, status, created_at
      )
    `, { count: "exact" })
    .eq("director_id", profile.id)
    .order("created_at", { ascending: false });

  // Apply filters
  if (status) {
    query = query.eq("relationship_status", status);
  }

  if (search) {
    // Search in client notes and family information
    query = buildSearchQuery(
      query,
      search,
      ["notes", "tags"]
    );
  }

  if (tags) {
    const tagList = tags.split(",");
    query = query.overlaps("tags", tagList);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: clients, error, count } = await query;

  if (error) {
    throw new ApiError("Failed to fetch clients", 500);
  }

  // Enhance with booking statistics
  const enhancedClients = await Promise.all(
    clients?.map(async (client) => {
      const { data: bookingStats } = await supabase
        .from("bookings")
        .select("status")
        .eq("director_id", profile.id)
        .eq("family_id", client.family_id);

      const stats = {
        total_bookings: bookingStats?.length || 0,
        completed_bookings: bookingStats?.filter(b => b.status === "completed").length || 0,
        pending_bookings: bookingStats?.filter(b => b.status === "pending").length || 0,
        cancelled_bookings: bookingStats?.filter(b => b.status === "cancelled").length || 0
      };

      return {
        ...client,
        booking_stats: stats
      };
    }) || []
  );

  const pagination = createPaginationInfo(page, limit, count || 0);

  return createSuccessResponse(
    enhancedClients,
    "Clients retrieved successfully",
    pagination
  );
}

async function POST(request: NextRequest) {
  const session = await requireUserType(request, ["director"]);
  const body: AddClientRequest = await request.json();
  
  validateRequiredFields(body, ["family_id"]);

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Verify family exists
  const { data: family, error: familyError } = await supabase
    .from("user_profiles")
    .select("id, name, email")
    .eq("id", body.family_id)
    .eq("user_type", "family")
    .single();

  if (familyError || !family) {
    throw new ApiError("Family not found", 404);
  }

  // Check if relationship already exists
  const { data: existingClient } = await supabase
    .from("director_clients")
    .select("id, relationship_status")
    .eq("director_id", profile.id)
    .eq("family_id", body.family_id)
    .single();

  if (existingClient) {
    if (existingClient.relationship_status === "active") {
      throw new ApiError("Client relationship already exists", 400);
    } else {
      // Reactivate existing relationship
      const { data: client, error } = await supabase
        .from("director_clients")
        .update({
          relationship_status: "active",
          notes: body.notes,
          tags: body.tags,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingClient.id)
        .select(`
          *,
          family:user_profiles!director_clients_family_id_fkey(
            id, name, email, phone, address
          )
        `)
        .single();

      if (error) {
        throw new ApiError("Failed to reactivate client relationship", 500);
      }

      return createSuccessResponse(client, "Client relationship reactivated successfully");
    }
  }

  // Create new client relationship
  const { data: client, error } = await supabase
    .from("director_clients")
    .insert({
      director_id: profile.id,
      family_id: body.family_id,
      relationship_status: "active",
      notes: body.notes,
      tags: body.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      family:user_profiles!director_clients_family_id_fkey(
        id, name, email, phone, address
      )
    `)
    .single();

  if (error) {
    throw new ApiError("Failed to add client", 500);
  }

  // Send notification to family
  await sendNotification(
    body.family_id,
    "system",
    "New Director Connection",
    `${profile.name} has added you as a client. You can now book services and communicate directly.`,
    { director_id: profile.id, client_id: client.id }
  );

  // Create initial chat room
  try {
    const { data: chatRoom } = await supabase
      .from("chat_rooms")
      .insert({
        type: "family_director",
        participants: [profile.id, body.family_id],
        title: `${family.name} & ${profile.name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (chatRoom) {
      // Add participants
      await supabase
        .from("chat_participants")
        .insert([
          { room_id: chatRoom.id, user_id: profile.id, joined_at: new Date().toISOString() },
          { room_id: chatRoom.id, user_id: body.family_id, joined_at: new Date().toISOString() }
        ]);
    }
  } catch (chatError) {
    console.error("Failed to create initial chat room:", chatError);
    // Don't fail the entire request if chat room creation fails
  }

  return createSuccessResponse(client, "Client added successfully");
}

export const GET_Handler = withErrorHandling(GET);
export const POST_Handler = withErrorHandling(POST);
export { GET_Handler as GET, POST_Handler as POST };