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
  parsePaginationParams,
  createPaginationInfo,
  getUserProfile,
  sendNotification
} from "@/lib/api-utils";

async function GET(request: NextRequest) {
  const session = await requireUserType(request, ["venue"]);
  const { page, limit } = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get("status");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const directorId = searchParams.get("director_id");
  const familyId = searchParams.get("family_id");
  const sortBy = searchParams.get("sort_by") || "date";
  const sortOrder = searchParams.get("sort_order") || "desc";

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  let query = supabase
    .from("bookings")
    .select(`
      *,
      family:user_profiles!bookings_family_id_fkey(
        id, name, email, phone, address, emergency_contact
      ),
      director:user_profiles!bookings_director_id_fkey(
        id, name, email, phone, company
      ),
      payments(*),
      calendar_events:calendar_events!calendar_events_booking_id_fkey(
        id, title, start_time, end_time
      )
    `, { count: "exact" })
    .eq("venue_id", profile.id)
    .order(sortBy, { ascending: sortOrder === "asc" });

  // Apply filters
  if (status) {
    query = query.eq("status", status);
  }

  if (startDate && validateDate(startDate)) {
    query = query.gte("date", startDate);
  }

  if (endDate && validateDate(endDate)) {
    query = query.lte("date", endDate);
  }

  if (directorId) {
    query = query.eq("director_id", directorId);
  }

  if (familyId) {
    query = query.eq("family_id", familyId);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: bookings, error, count } = await query;

  if (error) {
    throw new ApiError("Failed to fetch bookings", 500);
  }

  // Calculate booking statistics
  const totalBookings = count || 0;
  const completedBookings = bookings?.filter(b => b.status === "completed").length || 0;
  const pendingBookings = bookings?.filter(b => b.status === "pending").length || 0;
  const confirmedBookings = bookings?.filter(b => b.status === "confirmed").length || 0;
  const cancelledBookings = bookings?.filter(b => b.status === "cancelled").length || 0;

  const totalRevenue = bookings?.reduce((sum, booking) => {
    const payments = booking.payments || [];
    return sum + payments.reduce((paySum: number, payment: any) =>
      payment.status === "completed" ? paySum + payment.amount : paySum, 0);
  }, 0) || 0;

  const stats = {
    total_bookings: totalBookings,
    completed_bookings: completedBookings,
    pending_bookings: pendingBookings,
    confirmed_bookings: confirmedBookings,
    cancelled_bookings: cancelledBookings,
    total_revenue: Math.round(totalRevenue * 100) / 100,
    average_booking_value: totalBookings > 0 ? Math.round((totalRevenue / totalBookings) * 100) / 100 : 0,
    completion_rate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0,
    cancellation_rate: totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0
  };

  const pagination = createPaginationInfo(page, limit, totalBookings);

  return createSuccessResponse({
    bookings: bookings || [],
    stats,
    filters: {
      status, start_date: startDate, end_date: endDate,
      director_id: directorId, family_id: familyId,
      sort_by: sortBy, sort_order: sortOrder
    }
  }, "Bookings retrieved successfully", pagination);
}

async function PUT(request: NextRequest) {
  const session = await requireUserType(request, ["venue"]);
  const body = await request.json();
  
  const { booking_id, action, notes } = body;

  if (!booking_id || !action) {
    throw new ApiError("Booking ID and action are required", 400);
  }

  const validActions = ["confirm", "cancel", "complete"];
  if (!validActions.includes(action)) {
    throw new ApiError("Invalid action. Must be confirm, cancel, or complete", 400);
  }

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
      director:user_profiles!bookings_director_id_fkey(id, name, email)
    `)
    .eq("id", booking_id)
    .eq("venue_id", profile.id)
    .single();

  if (fetchError || !existingBooking) {
    throw new ApiError("Booking not found", 404);
  }

  // Validate action based on current status
  const validTransitions: Record<string, string[]> = {
    pending: ["confirm", "cancel"],
    confirmed: ["complete", "cancel"],
    completed: [],
    cancelled: []
  };

  if (!validTransitions[existingBooking.status]?.includes(action)) {
    throw new ApiError(
      `Cannot ${action} booking with status ${existingBooking.status}`,
      400
    );
  }

  // Update booking status
  const newStatus = action === "confirm" ? "confirmed" : 
                   action === "cancel" ? "cancelled" : "completed";

  const updateData: any = {
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  if (notes) {
    updateData.venue_notes = notes;
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", booking_id)
    .eq("venue_id", profile.id)
    .select(`
      *,
      family:user_profiles!bookings_family_id_fkey(id, name, email),
      director:user_profiles!bookings_director_id_fkey(id, name, email)
    `)
    .single();

  if (error) {
    throw new ApiError("Failed to update booking", 500);
  }

  // Update venue availability if booking is confirmed or cancelled
  if (action === "confirm") {
    // Mark time slot as booked
    const { data: availability } = await supabase
      .from("venue_availability")
      .select("id, time_slots")
      .eq("venue_id", profile.id)
      .eq("date", booking.date)
      .single();

    if (availability) {
      const updatedTimeSlots = availability.time_slots.map((slot: any) => {
        const slotStart = new Date(`${booking.date}T${slot.start_time}`);
        const slotEnd = new Date(`${booking.date}T${slot.end_time}`);
        const bookingStart = new Date(`${booking.date}T${booking.time}`);
        const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);

        // Check if booking overlaps with this slot
        if (bookingStart < slotEnd && bookingEnd > slotStart) {
          return {
            ...slot,
            is_available: false,
            booking_id: booking.id
          };
        }
        return slot;
      });

      await supabase
        .from("venue_availability")
        .update({ time_slots: updatedTimeSlots })
        .eq("id", availability.id);
    }
  } else if (action === "cancel") {
    // Free up the time slot
    const { data: availability } = await supabase
      .from("venue_availability")
      .select("id, time_slots")
      .eq("venue_id", profile.id)
      .eq("date", booking.date)
      .single();

    if (availability) {
      const updatedTimeSlots = availability.time_slots.map((slot: any) => {
        if (slot.booking_id === booking.id) {
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

  // Send notifications
  const actionMessages = {
    confirm: "Your venue booking has been confirmed",
    cancel: "Your venue booking has been cancelled",
    complete: "Your venue booking has been completed"
  };

  const message = actionMessages[action as keyof typeof actionMessages];

  if (booking.family_id) {
    await sendNotification(
      booking.family_id,
      "booking",
      "Booking Status Updated",
      `${message} at ${profile.venue_name || profile.name}`,
      { 
        booking_id: booking.id, 
        venue_id: profile.id, 
        new_status: newStatus,
        venue_notes: notes
      }
    );
  }

  if (booking.director_id) {
    await sendNotification(
      booking.director_id,
      "booking",
      "Venue Booking Updated", 
      `${message} at ${profile.venue_name || profile.name}`,
      { 
        booking_id: booking.id, 
        venue_id: profile.id, 
        new_status: newStatus,
        venue_notes: notes
      }
    );
  }

  return createSuccessResponse(booking, `Booking ${action}ed successfully`);
}

export const GET_Handler = withErrorHandling(GET);
export const PUT_Handler = withErrorHandling(PUT);
export { GET_Handler as GET, PUT_Handler as PUT };