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
  sendNotification
} from "@/lib/api-utils";
import { SendMessageRequest } from "@/types/api";

async function GET(request: NextRequest) {
  const session = await requireUserType(request, ["family"]);
  const { page, limit } = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const roomId = searchParams.get("room_id");
  const type = searchParams.get("type");

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  if (roomId) {
    // Get messages from specific room
    const { data: messages, error, count } = await supabase
      .from("chat_messages")
      .select(`
        *,
        sender:user_profiles!chat_messages_sender_id_fkey(id, name, email, user_type)
      `, { count: "exact" })
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new ApiError("Failed to fetch messages", 500);
    }

    // Mark messages as read
    await supabase
      .from("chat_messages")
      .update({
        read_by: supabase.rpc("array_append", {
          arr: supabase.sql`read_by`,
          elem: profile.id
        })
      })
      .eq("room_id", roomId)
      .not("read_by", "cs", `{${profile.id}}`);

    const pagination = createPaginationInfo(page, limit, count || 0);
    
    return createSuccessResponse(
      messages?.reverse(), // Reverse to show oldest first
      "Messages retrieved successfully",
      pagination
    );
  } else {
    // Get chat rooms for this family
    let query = supabase
      .from("chat_rooms")
      .select(`
        *,
        participants:chat_participants(
          user:user_profiles(id, name, email, user_type)
        ),
        last_message:chat_messages!chat_messages_room_id_fkey(
          id, message, message_type, created_at,
          sender:user_profiles!chat_messages_sender_id_fkey(id, name)
        )
      `, { count: "exact" })
      .contains("participants", [profile.id])
      .order("updated_at", { ascending: false });

    if (type) {
      query = query.eq("type", type);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: rooms, error, count } = await query;

    if (error) {
      throw new ApiError("Failed to fetch chat rooms", 500);
    }

    const pagination = createPaginationInfo(page, limit, count || 0);

    return createSuccessResponse(rooms, "Chat rooms retrieved successfully", pagination);
  }
}

async function POST(request: NextRequest) {
  const session = await requireUserType(request, ["family"]);
  const body: SendMessageRequest = await request.json();
  
  validateRequiredFields(body, ["room_id", "message"]);

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Verify user is participant in the room
  const { data: room, error: roomError } = await supabase
    .from("chat_rooms")
    .select(`
      *,
      participants:chat_participants(user_id)
    `)
    .eq("id", body.room_id)
    .single();

  if (roomError || !room) {
    throw new ApiError("Chat room not found", 404);
  }

  const isParticipant = room.participants.some(
    (p: any) => p.user_id === profile.id
  );

  if (!isParticipant) {
    throw new ApiError("Access denied - not a participant in this room", 403);
  }

  // Create message
  const { data: message, error } = await supabase
    .from("chat_messages")
    .insert({
      room_id: body.room_id,
      sender_id: profile.id,
      sender_type: "family",
      message: body.message,
      message_type: body.message_type || "text",
      metadata: body.metadata,
      read_by: [profile.id],
      created_at: new Date().toISOString()
    })
    .select(`
      *,
      sender:user_profiles!chat_messages_sender_id_fkey(id, name, email, user_type)
    `)
    .single();

  if (error) {
    throw new ApiError("Failed to send message", 500);
  }

  // Update room's last activity
  await supabase
    .from("chat_rooms")
    .update({
      updated_at: new Date().toISOString()
    })
    .eq("id", body.room_id);

  // Send notifications to other participants
  const otherParticipants = room.participants.filter(
    (p: any) => p.user_id !== profile.id
  );

  for (const participant of otherParticipants) {
    await sendNotification(
      participant.user_id,
      "message",
      "New Message",
      `${profile.name}: ${body.message.substring(0, 50)}${body.message.length > 50 ? "..." : ""}`,
      { 
        room_id: body.room_id,
        message_id: message.id,
        sender_name: profile.name
      }
    );
  }

  return createSuccessResponse(message, "Message sent successfully");
}

export { 
  withErrorHandling(GET) as GET,
  withErrorHandling(POST) as POST
};