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
  validateDate,
  parsePaginationParams,
  createPaginationInfo,
  getUserProfile,
  sendNotification
} from "@/lib/api-utils";
import { SetAvailabilityRequest, TimeSlot } from "@/types/api";

async function GET(request: NextRequest) {
  const session = await requireUserType(request, ["venue"]);
  const { page, limit } = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const view = searchParams.get("view") || "month";

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  let query = supabase
    .from("venue_availability")
    .select(`
      *,
      bookings:bookings!venue_availability_venue_id_fkey(
        id, service_type, date, time, duration, status,
        family:user_profiles!bookings_family_id_fkey(id, name, email, phone),
        director:user_profiles!bookings_director_id_fkey(id, name, email, phone)
      )
    `)
    .eq("venue_id", profile.id)
    .order("date", { ascending: true });

  // Apply date filters
  if (startDate && validateDate(startDate)) {
    query = query.gte("date", startDate);
  }
  
  if (endDate && validateDate(endDate)) {
    query = query.lte("date", endDate);
  }

  // Apply pagination for large date ranges
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: availability, error, count } = await query;

  if (error) {
    throw new ApiError("Failed to fetch availability", 500);
  }

  // Calculate availability statistics
  const totalSlots = availability?.reduce((sum, day) => 
    sum + (day.time_slots?.length || 0), 0) || 0;
  
  const availableSlots = availability?.reduce((sum, day) => 
    sum + (day.time_slots?.filter((slot: TimeSlot) => slot.is_available).length || 0), 0) || 0;
  
  const bookedSlots = availability?.reduce((sum, day) => 
    sum + (day.time_slots?.filter((slot: TimeSlot) => slot.booking_id).length || 0), 0) || 0;

  const stats = {
    total_slots: totalSlots,
    available_slots: availableSlots,
    booked_slots: bookedSlots,
    utilization_rate: totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0,
    availability_rate: totalSlots > 0 ? Math.round((availableSlots / totalSlots) * 100) : 0
  };

  const pagination = createPaginationInfo(page, limit, count || 0);

  return createSuccessResponse({
    availability: availability || [],
    stats,
    view,
    period: {
      start: startDate,
      end: endDate
    }
  }, "Availability retrieved successfully", pagination);
}

async function POST(request: NextRequest) {
  const session = await requireUserType(request, ["venue"]);
  const body: SetAvailabilityRequest = await request.json();
  
  validateRequiredFields(body, ["date", "time_slots"]);

  if (!validateDate(body.date)) {
    throw new ApiError("Invalid date format", 400);
  }

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Validate time slots
  for (const slot of body.time_slots) {
    if (!slot.start_time || !slot.end_time) {
      throw new ApiError("Each time slot must have start_time and end_time", 400);
    }
    
    const startTime = new Date(`2000-01-01T${slot.start_time}`);
    const endTime = new Date(`2000-01-01T${slot.end_time}`);
    
    if (startTime >= endTime) {
      throw new ApiError("End time must be after start time for all slots", 400);
    }
  }

  // Check if availability already exists for this date
  const { data: existingAvailability, error: fetchError } = await supabase
    .from("venue_availability")
    .select("id, time_slots")
    .eq("venue_id", profile.id)
    .eq("date", body.date)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw new ApiError("Database error", 500);
  }

  let availabilityData;

  if (existingAvailability) {
    // Update existing availability
    // Preserve existing bookings in time slots
    const updatedTimeSlots = body.time_slots.map(newSlot => {
      const existingSlot = existingAvailability.time_slots?.find(
        (slot: TimeSlot) => slot.start_time === newSlot.start_time && 
                           slot.end_time === newSlot.end_time
      );
      
      return {
        ...newSlot,
        booking_id: existingSlot?.booking_id || null // Preserve existing bookings
      };
    });

    const { data: availability, error } = await supabase
      .from("venue_availability")
      .update({
        time_slots: updatedTimeSlots,
        special_pricing: body.special_pricing,
        updated_at: new Date().toISOString()
      })
      .eq("id", existingAvailability.id)
      .select()
      .single();

    if (error) {
      throw new ApiError("Failed to update availability", 500);
    }

    availabilityData = availability;
  } else {
    // Create new availability
    const { data: availability, error } = await supabase
      .from("venue_availability")
      .insert({
        venue_id: profile.id,
        date: body.date,
        time_slots: body.time_slots,
        special_pricing: body.special_pricing,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new ApiError("Failed to create availability", 500);
    }

    availabilityData = availability;
  }

  // Notify directors and families with pending bookings for this date
  const { data: pendingBookings } = await supabase
    .from("bookings")
    .select(`
      id, director_id, family_id,
      director:user_profiles!bookings_director_id_fkey(id, name, email),
      family:user_profiles!bookings_family_id_fkey(id, name, email)
    `)
    .eq("venue_id", profile.id)
    .eq("date", body.date)
    .eq("status", "pending");

  if (pendingBookings && pendingBookings.length > 0) {
    for (const booking of pendingBookings) {
      // Check if their requested time is now available
      const requestedTime = booking.time;
      const isNowAvailable = body.time_slots.some(slot => 
        slot.start_time <= requestedTime && 
        slot.end_time > requestedTime && 
        slot.is_available
      );

      if (isNowAvailable) {
        if (booking.director_id) {
          await sendNotification(
            booking.director_id,
            "venue",
            "Venue Available",
            `${profile.venue_name || profile.name} is now available for your requested time on ${body.date}`,
            { venue_id: profile.id, booking_id: booking.id, date: body.date }
          );
        }

        if (booking.family_id) {
          await sendNotification(
            booking.family_id,
            "venue",
            "Venue Available",
            `${profile.venue_name || profile.name} is now available for ${body.date}`,
            { venue_id: profile.id, booking_id: booking.id, date: body.date }
          );
        }
      }
    }
  }

  return createSuccessResponse(availabilityData, "Availability updated successfully");
}

async function PUT(request: NextRequest) {
  const session = await requireUserType(request, ["venue"]);
  const body = await request.json();
  
  validateRequiredFields(body, ["date"]);

  if (!validateDate(body.date)) {
    throw new ApiError("Invalid date format", 400);
  }

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Block/unblock entire day
  const isBlocking = body.action === "block";
  const reason = body.reason || (isBlocking ? "Unavailable" : "Available");

  const { data: existingAvailability } = await supabase
    .from("venue_availability")
    .select("id, time_slots")
    .eq("venue_id", profile.id)
    .eq("date", body.date)
    .single();

  let timeSlots = [];
  
  if (isBlocking) {
    // Create blocked time slots for the entire day
    timeSlots = [
      {
        start_time: "00:00",
        end_time: "23:59",
        is_available: false,
        price: 0
      }
    ];
  } else {
    // Create default available time slots (example: 9 AM to 6 PM)
    for (let hour = 9; hour < 18; hour++) {
      timeSlots.push({
        start_time: `${hour.toString().padStart(2, '0')}:00`,
        end_time: `${(hour + 1).toString().padStart(2, '0')}:00`,
        is_available: true,
        price: profile.price_per_hour || 0
      });
    }
  }

  let availabilityData;

  if (existingAvailability) {
    const { data: availability, error } = await supabase
      .from("venue_availability")
      .update({
        time_slots: timeSlots,
        updated_at: new Date().toISOString()
      })
      .eq("id", existingAvailability.id)
      .select()
      .single();

    if (error) {
      throw new ApiError("Failed to update availability", 500);
    }

    availabilityData = availability;
  } else {
    const { data: availability, error } = await supabase
      .from("venue_availability")
      .insert({
        venue_id: profile.id,
        date: body.date,
        time_slots: timeSlots,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new ApiError("Failed to create availability", 500);
    }

    availabilityData = availability;
  }

  return createSuccessResponse(
    availabilityData, 
    `Day ${isBlocking ? 'blocked' : 'unblocked'} successfully`
  );
}

export const GET_Handler = withErrorHandling(GET);
export const POST_Handler = withErrorHandling(POST);
export const PUT_Handler = withErrorHandling(PUT);
export { GET_Handler as GET, POST_Handler as POST, PUT_Handler as PUT };