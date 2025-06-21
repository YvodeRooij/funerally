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
import { CreateEventRequest } from "@/types/api";

async function GET(request: NextRequest) {
  const session = await requireUserType(request, ["director"]);
  const { searchParams } = new URL(request.url);
  
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const type = searchParams.get("type");
  const view = searchParams.get("view") || "month";

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  let query = supabase
    .from("calendar_events")
    .select(`
      *,
      booking:bookings!calendar_events_booking_id_fkey(
        id, service_type, status, price,
        family:user_profiles!bookings_family_id_fkey(id, name, email, phone),
        venue:user_profiles!bookings_venue_id_fkey(id, name, venue_name, address)
      )
    `)
    .eq("owner_id", profile.id)
    .eq("owner_type", "director")
    .order("start_time", { ascending: true });

  // Apply date filters
  if (startDate && validateDate(startDate)) {
    query = query.gte("start_time", startDate);
  }
  
  if (endDate && validateDate(endDate)) {
    query = query.lte("end_time", endDate);
  }

  // Apply type filter
  if (type) {
    query = query.eq("type", type);
  }

  const { data: events, error } = await query;

  if (error) {
    throw new ApiError("Failed to fetch calendar events", 500);
  }

  // Get availability summary for the period
  const { data: availabilityStats } = await supabase
    .from("calendar_events")
    .select("type")
    .eq("owner_id", profile.id)
    .eq("owner_type", "director")
    .gte("start_time", startDate || new Date().toISOString())
    .lte("end_time", endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

  const stats = {
    total_events: events?.length || 0,
    bookings: events?.filter(e => e.type === "booking").length || 0,
    blocked_time: events?.filter(e => e.type === "blocked").length || 0,
    available_time: events?.filter(e => e.type === "available").length || 0,
    availability_percentage: availabilityStats?.length 
      ? (availabilityStats.filter(s => s.type === "available").length / availabilityStats.length) * 100
      : 0
  };

  return createSuccessResponse({
    events: events || [],
    stats,
    view,
    period: {
      start: startDate,
      end: endDate
    }
  });
}

async function POST(request: NextRequest) {
  const session = await requireUserType(request, ["director"]);
  const body: CreateEventRequest = await request.json();
  
  validateRequiredFields(body, ["title", "start_time", "end_time", "type"]);

  if (!validateDate(body.start_time) || !validateDate(body.end_time)) {
    throw new ApiError("Invalid date format", 400);
  }

  const startTime = new Date(body.start_time);
  const endTime = new Date(body.end_time);

  if (startTime >= endTime) {
    throw new ApiError("End time must be after start time", 400);
  }

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Check for conflicting events
  const { data: conflictingEvents } = await supabase
    .from("calendar_events")
    .select("id, title, start_time, end_time")
    .eq("owner_id", profile.id)
    .eq("owner_type", "director")
    .or(`start_time.lte.${body.end_time},end_time.gte.${body.start_time}`);

  if (conflictingEvents && conflictingEvents.length > 0) {
    // Allow multiple available slots, but warn about other conflicts
    const nonAvailableConflicts = conflictingEvents.filter(e => 
      !e.title.toLowerCase().includes("available")
    );
    
    if (nonAvailableConflicts.length > 0) {
      throw new ApiError(
        `Time slot conflicts with existing event: ${nonAvailableConflicts[0].title}`,
        400
      );
    }
  }

  // Validate booking if provided
  if (body.booking_id) {
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, status, director_id")
      .eq("id", body.booking_id)
      .eq("director_id", profile.id)
      .single();

    if (bookingError || !booking) {
      throw new ApiError("Booking not found", 404);
    }

    if (booking.status === "cancelled") {
      throw new ApiError("Cannot create event for cancelled booking", 400);
    }
  }

  const eventData: any = {
    owner_id: profile.id,
    owner_type: "director",
    title: body.title,
    description: body.description,
    start_time: body.start_time,
    end_time: body.end_time,
    type: body.type,
    booking_id: body.booking_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Handle recurring events
  if (body.recurring) {
    eventData.recurring_pattern = body.recurring.pattern;
    eventData.recurring_end_date = body.recurring.end_date;
  }

  const { data: event, error } = await supabase
    .from("calendar_events")
    .insert(eventData)
    .select(`
      *,
      booking:bookings!calendar_events_booking_id_fkey(
        id, service_type, status,
        family:user_profiles!bookings_family_id_fkey(id, name, email)
      )
    `)
    .single();

  if (error) {
    throw new ApiError("Failed to create calendar event", 500);
  }

  // Create recurring events if specified
  if (body.recurring && body.recurring.end_date) {
    const recurringEvents = generateRecurringEvents(
      eventData,
      body.recurring.pattern,
      new Date(body.recurring.end_date)
    );

    if (recurringEvents.length > 0) {
      const { error: recurringError } = await supabase
        .from("calendar_events")
        .insert(recurringEvents);

      if (recurringError) {
        console.error("Failed to create recurring events:", recurringError);
        // Don't fail the main request if recurring events fail
      }
    }
  }

  // Send notification if this is a booking event
  if (body.booking_id && event.booking) {
    await sendNotification(
      event.booking.family.id,
      "booking",
      "Appointment Scheduled",
      `Your appointment has been scheduled: ${body.title}`,
      { 
        booking_id: body.booking_id,
        event_id: event.id,
        start_time: body.start_time
      }
    );
  }

  return createSuccessResponse(event, "Calendar event created successfully");
}

function generateRecurringEvents(
  baseEvent: any,
  pattern: string,
  endDate: Date
): any[] {
  const events = [];
  const startDate = new Date(baseEvent.start_time);
  const duration = new Date(baseEvent.end_time).getTime() - startDate.getTime();
  
  let currentDate = new Date(startDate);
  
  // Move to next occurrence
  switch (pattern) {
    case "daily":
      currentDate.setDate(currentDate.getDate() + 1);
      break;
    case "weekly":
      currentDate.setDate(currentDate.getDate() + 7);
      break;
    case "monthly":
      currentDate.setMonth(currentDate.getMonth() + 1);
      break;
  }

  while (currentDate <= endDate) {
    const eventEndTime = new Date(currentDate.getTime() + duration);
    
    events.push({
      ...baseEvent,
      start_time: currentDate.toISOString(),
      end_time: eventEndTime.toISOString(),
      recurring_parent_id: baseEvent.id
    });

    // Move to next occurrence
    switch (pattern) {
      case "daily":
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case "weekly":
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  return events;
}

export { 
  withErrorHandling(GET) as GET,
  withErrorHandling(POST) as POST
};