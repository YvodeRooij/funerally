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
  getUserProfile,
  sendNotification
} from "@/lib/api-utils";

async function POST(request: NextRequest) {
  const session = await requireUserType(request, ["family"]);
  const body = await request.json();
  
  validateRequiredFields(body, ["participants", "type"]);

  const { participants, type, title, booking_id } = body;

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Validate participants exist
  const { data: validParticipants, error: participantsError } = await supabase
    .from("user_profiles")
    .select("id, name, email, user_type")
    .in("id", participants);

  if (participantsError || !validParticipants || validParticipants.length !== participants.length) {
    throw new ApiError("Invalid participants", 400);
  }

  // Ensure family is included in participants
  if (!participants.includes(profile.id)) {
    participants.push(profile.id);
  }

  // Validate room type
  const validTypes = ["family_director", "family_venue", "director_venue", "group"];
  if (!validTypes.includes(type)) {
    throw new ApiError("Invalid chat room type", 400);
  }

  // Check if room already exists for these participants (for non-group chats)
  if (type !== "group" && participants.length === 2) {
    const { data: existingRoom } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("type", type)
      .contains("participants", participants)
      .single();

    if (existingRoom) {
      return createSuccessResponse(
        { room_id: existingRoom.id, existing: true },
        "Using existing chat room"
      );
    }
  }

  // Create chat room
  const { data: room, error } = await supabase
    .from("chat_rooms")
    .insert({
      type,
      participants,
      booking_id,
      title: title || generateRoomTitle(type, validParticipants),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new ApiError("Failed to create chat room", 500);
  }

  // Add participants to chat_participants table
  const participantRecords = participants.map((userId: string) => ({
    room_id: room.id,
    user_id: userId,
    joined_at: new Date().toISOString()
  }));

  const { error: participantsInsertError } = await supabase
    .from("chat_participants")
    .insert(participantRecords);

  if (participantsInsertError) {
    // Clean up room if participant insertion fails
    await supabase.from("chat_rooms").delete().eq("id", room.id);
    throw new ApiError("Failed to add participants to chat room", 500);
  }

  // Send notifications to other participants
  const otherParticipants = participants.filter((id: string) => id !== profile.id);
  
  for (const participantId of otherParticipants) {
    await sendNotification(
      participantId,
      "message",
      "New Chat Room",
      `${profile.name} started a new chat: ${room.title}`,
      { room_id: room.id }
    );
  }

  return createSuccessResponse(
    { 
      room_id: room.id, 
      title: room.title,
      type: room.type,
      participants: validParticipants
    },
    "Chat room created successfully"
  );
}

function generateRoomTitle(type: string, participants: any[]): string {
  switch (type) {
    case "family_director":
      const director = participants.find(p => p.user_type === "director");
      const family = participants.find(p => p.user_type === "family");
      return `${family?.name} & ${director?.name}`;
    
    case "family_venue":
      const venue = participants.find(p => p.user_type === "venue");
      const familyMember = participants.find(p => p.user_type === "family");
      return `${familyMember?.name} & ${venue?.name}`;
    
    case "director_venue":
      const directorMember = participants.find(p => p.user_type === "director");
      const venueMember = participants.find(p => p.user_type === "venue");
      return `${directorMember?.name} & ${venueMember?.name}`;
    
    default:
      return `Group Chat - ${participants.map(p => p.name).join(", ")}`;
  }
}

export const POST_Handler = withErrorHandling(POST);
export { POST_Handler as POST };