import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireAuth,
  requireUserType,
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
  ApiError,
  validateDate,
  getUserProfile,
  sendNotification
} from "@/lib/api-utils";
import { UpdateBookingRequest } from "@/types/api";

async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUserType(request, ["family"]);
  const { id } = await params;
  const bookingId = id;

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(`
      *,
      director:user_profiles!bookings_director_id_fkey(id, name, email, phone, company),
      venue:user_profiles!bookings_venue_id_fkey(id, name, email, phone, venue_name, address),
      payments(*),
      documents:booking_documents(
        document:documents(*)
      ),
      chat_room:chat_rooms!chat_rooms_booking_id_fkey(*)
    `)
    .eq("id", bookingId)
    .eq("family_id", profile.id)
    .single();

  if (error || !booking) {
    throw new ApiError("Booking not found", 404);
  }

  return createSuccessResponse(booking);
}

async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUserType(request, ["family"]);
  const { id } = await params;
  const bookingId = id;
  const body: UpdateBookingRequest = await request.json();

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Get existing booking
  const { data: existingBooking, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("family_id", profile.id)
    .single();

  if (fetchError || !existingBooking) {
    throw new ApiError("Booking not found", 404);
  }

  // Check if booking can be modified
  if (existingBooking.status === "completed" || existingBooking.status === "cancelled") {
    throw new ApiError("Cannot modify completed or cancelled booking", 400);
  }

  // Validate date if provided
  if (body.date && !validateDate(body.date)) {
    throw new ApiError("Invalid date format", 400);
  }

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  // Only update provided fields
  if (body.date !== undefined) updateData.date = body.date;
  if (body.time !== undefined) updateData.time = body.time;
  if (body.duration !== undefined) updateData.duration = body.duration;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.notes !== undefined) updateData.notes = body.notes;

  const { data: booking, error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId)
    .eq("family_id", profile.id)
    .select(`
      *,
      director:user_profiles!bookings_director_id_fkey(id, name, email, phone),
      venue:user_profiles!bookings_venue_id_fkey(id, name, email, phone, venue_name)
    `)
    .single();

  if (error) {
    throw new ApiError("Failed to update booking", 500);
  }

  // Send notifications if status changed
  if (body.status && body.status !== existingBooking.status) {
    const statusMessages = {
      confirmed: "Your booking has been confirmed",
      cancelled: "Your booking has been cancelled",
      completed: "Your booking has been completed"
    };

    if (booking.director_id) {
      await sendNotification(
        booking.director_id,
        "booking",
        "Booking Status Updated",
        `Booking status changed to ${body.status}`,
        { booking_id: booking.id, new_status: body.status }
      );
    }

    if (booking.venue_id) {
      await sendNotification(
        booking.venue_id,
        "booking",
        "Booking Status Updated",
        `Booking status changed to ${body.status}`,
        { booking_id: booking.id, new_status: body.status }
      );
    }
  }

  return createSuccessResponse(booking, "Booking updated successfully");
}

async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUserType(request, ["family"]);
  const { id } = await params;
  const bookingId = id;

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Get existing booking
  const { data: existingBooking, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("family_id", profile.id)
    .single();

  if (fetchError || !existingBooking) {
    throw new ApiError("Booking not found", 404);
  }

  // Check if booking can be cancelled
  if (existingBooking.status === "completed") {
    throw new ApiError("Cannot cancel completed booking", 400);
  }

  // Soft delete - update status to cancelled
  const { data: booking, error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString()
    })
    .eq("id", bookingId)
    .eq("family_id", profile.id)
    .select()
    .single();

  if (error) {
    throw new ApiError("Failed to cancel booking", 500);
  }

  // Send cancellation notifications
  if (booking.director_id) {
    await sendNotification(
      booking.director_id,
      "booking",
      "Booking Cancelled",
      "A booking has been cancelled by the family",
      { booking_id: booking.id }
    );
  }

  if (booking.venue_id) {
    await sendNotification(
      booking.venue_id,
      "booking",
      "Booking Cancelled",
      "A venue booking has been cancelled",
      { booking_id: booking.id }
    );
  }

  return createSuccessResponse(booking, "Booking cancelled successfully");
}

export const GET_Handler = withErrorHandling(GET);
export const PUT_Handler = withErrorHandling(PUT);
export const DELETE_Handler = withErrorHandling(DELETE);
export { GET_Handler as GET, PUT_Handler as PUT, DELETE_Handler as DELETE };