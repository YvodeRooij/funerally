import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireAuth,
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
  { params }: { params: { id: string } }
) {
  const session = await requireAuth(request);
  const bookingId = params.id;

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(`
      *,
      family:user_profiles!bookings_family_id_fkey(
        id, name, email, phone, address, emergency_contact
      ),
      director:user_profiles!bookings_director_id_fkey(
        id, name, email, phone, company, bio
      ),
      venue:user_profiles!bookings_venue_id_fkey(
        id, name, email, phone, venue_name, address, amenities, capacity
      ),
      payments(*),
      documents:booking_documents(
        id,
        document:documents(id, title, type, file_size, created_at, owner_id)
      ),
      chat_room:chat_rooms!chat_rooms_booking_id_fkey(
        id, type, title, participants, updated_at
      ),
      calendar_events:calendar_events!calendar_events_booking_id_fkey(
        id, title, start_time, end_time, owner_type
      ),
      booking_history:booking_status_history(
        id, status, changed_by_type, changed_by_id, notes, created_at
      )
    `)
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    throw new ApiError("Booking not found", 404);
  }

  // Check if user has access to this booking
  const hasAccess = 
    booking.family_id === profile.id ||
    booking.director_id === profile.id ||
    booking.venue_id === profile.id;

  if (!hasAccess) {
    throw new ApiError("Access denied", 403);
  }

  return createSuccessResponse(booking);
}

async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth(request);
  const bookingId = params.id;
  const body: UpdateBookingRequest = await request.json();

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Get existing booking
  const { data: existingBooking, error: fetchError } = await supabase
    .from("bookings")
    .select(`
      *,
      family:user_profiles!bookings_family_id_fkey(id, name, email),
      director:user_profiles!bookings_director_id_fkey(id, name, email),
      venue:user_profiles!bookings_venue_id_fkey(id, name, venue_name)
    `)
    .eq("id", bookingId)
    .single();

  if (fetchError || !existingBooking) {
    throw new ApiError("Booking not found", 404);
  }

  // Check if user has permission to modify this booking
  const canModify = 
    existingBooking.family_id === profile.id ||
    existingBooking.director_id === profile.id ||
    existingBooking.venue_id === profile.id;

  if (!canModify) {
    throw new ApiError("Access denied", 403);
  }

  // Check if booking can be modified
  if (existingBooking.status === "completed") {
    throw new ApiError("Cannot modify completed booking", 400);
  }

  // Validate status transitions based on user type
  if (body.status) {
    const validTransitions: Record<string, Record<string, string[]>> = {
      family: {
        pending: ["cancelled"],
        confirmed: ["cancelled"],
        cancelled: []
      },
      director: {
        pending: ["confirmed", "cancelled"],
        confirmed: ["completed", "cancelled"],
        cancelled: [],
        completed: []
      },
      venue: {
        pending: ["confirmed", "cancelled"],
        confirmed: ["completed", "cancelled"],
        cancelled: [],
        completed: []
      }
    };

    const allowedTransitions = validTransitions[profile.user_type]?.[existingBooking.status] || [];
    if (!allowedTransitions.includes(body.status)) {
      throw new ApiError(
        `Cannot change status from ${existingBooking.status} to ${body.status}`,
        400
      );
    }
  }

  // Validate date if provided
  if (body.date && !validateDate(body.date)) {
    throw new ApiError("Invalid date format", 400);
  }

  // Only families can modify booking details (date, time, duration)
  if ((body.date || body.time || body.duration) && profile.user_type !== "family") {
    throw new ApiError("Only families can modify booking details", 403);
  }

  // Check if reschedule is possible (date/time changes)
  if (body.date || body.time) {
    const newDate = body.date || existingBooking.date;
    const newTime = body.time || existingBooking.time;
    const newDateTime = new Date(`${newDate}T${newTime}`);

    if (newDateTime <= new Date()) {
      throw new ApiError("New booking time must be in the future", 400);
    }

    // Check venue availability if venue is involved and date/time is changing
    if (existingBooking.venue_id && (body.date || body.time)) {
      const { data: availability } = await supabase
        .from("venue_availability")
        .select("time_slots")
        .eq("venue_id", existingBooking.venue_id)
        .eq("date", newDate)
        .single();

      if (availability && availability.time_slots) {
        const duration = body.duration || existingBooking.duration;
        const endTime = new Date(newDateTime.getTime() + duration * 60000)
          .toTimeString().slice(0, 5);

        const isAvailable = availability.time_slots.some((slot: any) => 
          slot.is_available &&
          slot.start_time <= newTime &&
          slot.end_time >= endTime &&
          slot.booking_id !== bookingId // Allow current booking slot
        );

        if (!isAvailable) {
          throw new ApiError("Venue is not available at the new requested time", 400);
        }
      }
    }
  }

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  // Build update data based on user permissions
  if (body.date !== undefined) updateData.date = body.date;
  if (body.time !== undefined) updateData.time = body.time;
  if (body.duration !== undefined) updateData.duration = body.duration;
  if (body.status !== undefined) updateData.status = body.status;

  // Handle notes based on user type
  if (body.notes !== undefined) {
    switch (profile.user_type) {
      case "family":
        updateData.notes = body.notes;
        break;
      case "director":
        updateData.director_notes = body.notes;
        break;
      case "venue":
        updateData.venue_notes = body.notes;
        break;
    }
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId)
    .select(`
      *,
      family:user_profiles!bookings_family_id_fkey(id, name, email),
      director:user_profiles!bookings_director_id_fkey(id, name, email),
      venue:user_profiles!bookings_venue_id_fkey(id, name, venue_name)
    `)
    .single();

  if (error) {
    throw new ApiError("Failed to update booking", 500);
  }

  // Record status change in history
  if (body.status && body.status !== existingBooking.status) {
    await supabase
      .from("booking_status_history")
      .insert({
        booking_id: bookingId,
        status: body.status,
        changed_by_type: profile.user_type,
        changed_by_id: profile.id,
        notes: body.notes,
        created_at: new Date().toISOString()
      });
  }

  // Update venue availability if needed
  if (existingBooking.venue_id && body.status) {
    const { data: availability } = await supabase
      .from("venue_availability")
      .select("id, time_slots")
      .eq("venue_id", existingBooking.venue_id)
      .eq("date", booking.date)
      .single();

    if (availability) {
      const updatedTimeSlots = availability.time_slots.map((slot: any) => {
        if (slot.booking_id === bookingId) {
          return {
            ...slot,
            is_available: body.status === "cancelled",
            booking_id: body.status === "cancelled" ? null : bookingId
          };
        }
        return slot;
      });

      await supabase
        .from("venue_availability")
        .update({ time_slots: updatedTimeSlots })
        .eq("id", availability.id);
    }
  }

  // Send notifications to other parties
  const statusMessages: Record<string, string> = {
    confirmed: "has been confirmed",
    cancelled: "has been cancelled",
    completed: "has been completed"
  };

  if (body.status && statusMessages[body.status]) {
    const message = `Your booking ${statusMessages[body.status]}`;
    
    // Notify other parties (excluding the one who made the change)
    const notifyList = [
      { id: booking.family_id, type: "family" },
      { id: booking.director_id, type: "director" },
      { id: booking.venue_id, type: "venue" }
    ].filter(party => party.id && party.id !== profile.id);

    for (const party of notifyList) {
      await sendNotification(
        party.id!,
        "booking",
        "Booking Status Updated",
        message,
        { 
          booking_id: bookingId,
          new_status: body.status,
          changed_by: profile.name,
          changed_by_type: profile.user_type
        }
      );
    }
  }

  return createSuccessResponse(booking, "Booking updated successfully");
}

async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth(request);
  const bookingId = params.id;

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Get existing booking
  const { data: existingBooking, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (fetchError || !existingBooking) {
    throw new ApiError("Booking not found", 404);
  }

  // Only families can delete (cancel) bookings
  if (profile.user_type !== "family" || existingBooking.family_id !== profile.id) {
    throw new ApiError("Only the family who created the booking can delete it", 403);
  }

  // Check if booking can be cancelled
  if (existingBooking.status === "completed") {
    throw new ApiError("Cannot cancel completed booking", 400);
  }

  if (existingBooking.status === "cancelled") {
    throw new ApiError("Booking is already cancelled", 400);
  }

  // Soft delete - update status to cancelled
  const { data: booking, error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString()
    })
    .eq("id", bookingId)
    .select()
    .single();

  if (error) {
    throw new ApiError("Failed to cancel booking", 500);
  }

  // Record cancellation in history
  await supabase
    .from("booking_status_history")
    .insert({
      booking_id: bookingId,
      status: "cancelled",
      changed_by_type: "family",
      changed_by_id: profile.id,
      notes: "Booking cancelled by family",
      created_at: new Date().toISOString()
    });

  // Free up venue time slot
  if (existingBooking.venue_id) {
    const { data: availability } = await supabase
      .from("venue_availability")
      .select("id, time_slots")
      .eq("venue_id", existingBooking.venue_id)
      .eq("date", existingBooking.date)
      .single();

    if (availability) {
      const updatedTimeSlots = availability.time_slots.map((slot: any) => {
        if (slot.booking_id === bookingId) {
          return {
            ...slot,
            is_available: true,
            booking_id: null
          };
        }
        return slot;
      });

      await supabase
        .from("venue_availability")
        .update({ time_slots: updatedTimeSlots })
        .eq("id", availability.id);
    }
  }

  // Send cancellation notifications
  const notifyList = [
    existingBooking.director_id,
    existingBooking.venue_id
  ].filter(Boolean);

  for (const userId of notifyList) {
    await sendNotification(
      userId!,
      "booking",
      "Booking Cancelled",
      `${profile.name} has cancelled their booking for ${existingBooking.date}`,
      { 
        booking_id: bookingId,
        cancelled_by: profile.name,
        service_type: existingBooking.service_type,
        date: existingBooking.date,
        time: existingBooking.time
      }
    );
  }

  return createSuccessResponse(booking, "Booking cancelled successfully");
}

export { 
  withErrorHandling(GET) as GET,
  withErrorHandling(PUT) as PUT,
  withErrorHandling(DELETE) as DELETE
};