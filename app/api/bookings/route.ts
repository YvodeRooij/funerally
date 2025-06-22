import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireAuth,
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
import { CreateBookingRequest } from "@/types/api";

async function GET(request: NextRequest) {
  const session = await requireAuth(request);
  const { page, limit } = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get("status");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const userType = searchParams.get("user_type");
  const serviceType = searchParams.get("service_type");

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  let query = supabase
    .from("bookings")
    .select(`
      *,
      family:user_profiles!bookings_family_id_fkey(
        id, name, email, phone, address
      ),
      director:user_profiles!bookings_director_id_fkey(
        id, name, email, phone, company
      ),
      venue:user_profiles!bookings_venue_id_fkey(
        id, name, email, phone, venue_name, address
      ),
      payments(*),
      documents:booking_documents(
        document:documents(id, title, type, created_at)
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false });

  // Filter based on user role
  switch (profile.user_type) {
    case "family":
      query = query.eq("family_id", profile.id);
      break;
    case "director":
      query = query.eq("director_id", profile.id);
      break;
    case "venue":
      query = query.eq("venue_id", profile.id);
      break;
    default:
      throw new ApiError("Invalid user type", 403);
  }

  // Apply additional filters
  if (status) {
    query = query.eq("status", status);
  }

  if (startDate && validateDate(startDate)) {
    query = query.gte("date", startDate);
  }

  if (endDate && validateDate(endDate)) {
    query = query.lte("date", endDate);
  }

  if (serviceType) {
    query = query.eq("service_type", serviceType);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: bookings, error, count } = await query;

  if (error) {
    throw new ApiError("Failed to fetch bookings", 500);
  }

  const pagination = createPaginationInfo(page, limit, count || 0);

  return createSuccessResponse({
    bookings: bookings || [],
    user_role: profile.user_type,
    filters: {
      status, start_date: startDate, end_date: endDate,
      service_type: serviceType
    }
  }, "Bookings retrieved successfully", pagination);
}

async function POST(request: NextRequest) {
  const session = await requireAuth(request);
  const body: CreateBookingRequest = await request.json();
  
  validateRequiredFields(body, ["service_type", "date", "time", "duration"]);
  
  if (!validateDate(body.date)) {
    throw new ApiError("Invalid date format", 400);
  }

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Only families can create new bookings through this endpoint
  if (profile.user_type !== "family") {
    throw new ApiError("Only families can create bookings", 403);
  }

  // Validate that the booking date is in the future
  const bookingDate = new Date(`${body.date}T${body.time}`);
  if (bookingDate <= new Date()) {
    throw new ApiError("Booking date must be in the future", 400);
  }

  // Validate director exists if provided
  let directorId = body.director_id;
  if (directorId) {
    const { data: director, error: directorError } = await supabase
      .from("user_profiles")
      .select("id, name, email")
      .eq("id", directorId)
      .eq("user_type", "director")
      .eq("status", "active")
      .single();
    
    if (directorError || !director) {
      throw new ApiError("Director not found or inactive", 404);
    }
  }

  // Validate venue exists if provided
  let venueId = body.venue_id;
  if (venueId) {
    const { data: venue, error: venueError } = await supabase
      .from("user_profiles")
      .select("id, name, venue_name, price_per_hour")
      .eq("id", venueId)
      .eq("user_type", "venue")
      .eq("status", "active")
      .single();
    
    if (venueError || !venue) {
      throw new ApiError("Venue not found or inactive", 404);
    }

    // Check venue availability
    const { data: availability } = await supabase
      .from("venue_availability")
      .select("time_slots")
      .eq("venue_id", venueId)
      .eq("date", body.date)
      .single();

    if (availability && availability.time_slots) {
      const requestedStartTime = body.time;
      const requestedEndTime = new Date(
        new Date(`${body.date}T${body.time}`).getTime() + body.duration * 60000
      ).toTimeString().slice(0, 5);

      const isAvailable = availability.time_slots.some((slot: any) => 
        slot.is_available &&
        slot.start_time <= requestedStartTime &&
        slot.end_time >= requestedEndTime
      );

      if (!isAvailable) {
        throw new ApiError("Venue is not available at the requested time", 400);
      }
    }
  }

  // Calculate estimated price
  let estimatedPrice = 0;
  if (venueId) {
    const { data: venue } = await supabase
      .from("user_profiles")
      .select("price_per_hour")
      .eq("id", venueId)
      .single();
    
    if (venue?.price_per_hour) {
      estimatedPrice += venue.price_per_hour * (body.duration / 60);
    }
  }

  // Create booking
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      family_id: profile.id,
      director_id: directorId,
      venue_id: venueId,
      service_type: body.service_type,
      date: body.date,
      time: body.time,
      duration: body.duration,
      status: "pending",
      price: estimatedPrice > 0 ? estimatedPrice : null,
      notes: body.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      family:user_profiles!bookings_family_id_fkey(id, name, email),
      director:user_profiles!bookings_director_id_fkey(id, name, email),
      venue:user_profiles!bookings_venue_id_fkey(id, name, venue_name)
    `)
    .single();

  if (error) {
    throw new ApiError("Failed to create booking", 500);
  }

  // Send notifications
  if (directorId) {
    await sendNotification(
      directorId,
      "booking",
      "New Booking Request",
      `New booking request from ${profile.name} for ${body.service_type} on ${body.date}`,
      { 
        booking_id: booking.id,
        family_name: profile.name,
        service_type: body.service_type,
        date: body.date,
        time: body.time
      }
    );
  }

  if (venueId) {
    await sendNotification(
      venueId,
      "booking",
      "New Venue Booking Request",
      `New venue booking request for ${body.date} at ${body.time}`,
      { 
        booking_id: booking.id,
        family_name: profile.name,
        date: body.date,
        time: body.time,
        duration: body.duration
      }
    );
  }

  // Create initial chat room if director is involved
  if (directorId) {
    try {
      const { data: chatRoom } = await supabase
        .from("chat_rooms")
        .insert({
          type: "family_director",
          participants: [profile.id, directorId],
          booking_id: booking.id,
          title: `${profile.name} & ${booking.director?.name} - ${body.service_type}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (chatRoom) {
        await supabase
          .from("chat_participants")
          .insert([
            { room_id: chatRoom.id, user_id: profile.id, joined_at: new Date().toISOString() },
            { room_id: chatRoom.id, user_id: directorId, joined_at: new Date().toISOString() }
          ]);
      }
    } catch (chatError) {
      console.error("Failed to create booking chat room:", chatError);
      // Don't fail the booking if chat room creation fails
    }
  }

  return createSuccessResponse(booking, "Booking created successfully");
}

export const GET_Handler = withErrorHandling(GET);
export const POST_Handler = withErrorHandling(POST);
export { GET_Handler as GET, POST_Handler as POST };