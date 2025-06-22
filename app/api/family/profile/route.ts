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
  validateEmail
} from "@/lib/api-utils";

async function GET(request: NextRequest) {
  const session = await requireUserType(request, ["family"]);
  
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select(`
      *,
      bookings:bookings(count),
      documents:documents(count),
      chat_rooms:chat_participants!inner(
        room:chat_rooms(*)
      )
    `)
    .eq("email", session.user.email)
    .eq("user_type", "family")
    .single();

  if (error) {
    throw new ApiError("Failed to fetch profile", 500);
  }

  return createSuccessResponse(profile);
}

async function PUT(request: NextRequest) {
  const session = await requireUserType(request, ["family"]);
  const body = await request.json();
  
  const {
    name,
    phone,
    address,
    emergency_contact,
    family_code,
    preferences
  } = body;

  // Validate required fields
  validateRequiredFields(body, ["name"]);

  // Validate email if provided
  if (body.email && !validateEmail(body.email)) {
    throw new ApiError("Invalid email format", 400);
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .update({
      name,
      phone,
      address,
      emergency_contact,
      family_code,
      preferences,
      updated_at: new Date().toISOString()
    })
    .eq("email", session.user.email)
    .eq("user_type", "family")
    .select()
    .single();

  if (error) {
    throw new ApiError("Failed to update profile", 500);
  }

  return createSuccessResponse(profile, "Profile updated successfully");
}

async function DELETE(request: NextRequest) {
  const session = await requireUserType(request, ["family"]);
  
  // Soft delete - mark as inactive instead of hard delete
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .update({
      status: "inactive",
      updated_at: new Date().toISOString()
    })
    .eq("email", session.user.email)
    .eq("user_type", "family")
    .select()
    .single();

  if (error) {
    throw new ApiError("Failed to deactivate profile", 500);
  }

  return createSuccessResponse(null, "Profile deactivated successfully");
}

export const GET_Handler = withErrorHandling(GET);
export const PUT_Handler = withErrorHandling(PUT);
export const DELETE_Handler = withErrorHandling(DELETE);
export { GET_Handler as GET, PUT_Handler as PUT, DELETE_Handler as DELETE };