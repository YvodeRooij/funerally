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
import { CreateBookingRequest, UpdateBookingRequest } from "@/types/api";

async function GET(request: NextRequest) {
  const session = await requireUserType(request, ["family"]);
  const { page, limit } = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get("status");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  let query = supabase
    .from("bookings")
    .select(`
      *,
      director:user_profiles!bookings_director_id_fkey(id, name, email, phone, company),
      venue:user_profiles!bookings_venue_id_fkey(id, name, email, phone, venue_name, address),
      payments(*)
    `, { count: "exact" })
    .eq("family_id", profile.id)
    .order("created_at", { ascending: false });

  // Apply filters
  if (status) {
    query = query.eq("status", status);
  }
  
  if (fromDate && validateDate(fromDate)) {
    query = query.gte("date", fromDate);
  }
  
  if (toDate && validateDate(toDate)) {
    query = query.lte("date", toDate);
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

  return createSuccessResponse(bookings, "Bookings retrieved successfully", pagination);
}

async function POST(request: NextRequest) {
  const session = await requireUserType(request, ["family"]);
  const body: CreateBookingRequest = await request.json();
  
  validateRequiredFields(body, ["service_type", "date", "time", "duration"]);
  
  if (!validateDate(body.date)) {
    throw new ApiError("Invalid date format", 400);
  }

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Validate director and venue exist if provided
  if (body.director_id) {
    const { data: director } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", body.director_id)
      .eq("user_type", "director")
      .single();
    
    if (!director) {
      throw new ApiError("Director not found", 404);
    }
  }

  if (body.venue_id) {
    const { data: venue } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", body.venue_id)
      .eq("user_type", "venue")
      .single();
    
    if (!venue) {
      throw new ApiError("Venue not found", 404);
    }
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      family_id: profile.id,
      director_id: body.director_id,
      venue_id: body.venue_id,
      service_type: body.service_type,
      date: body.date,
      time: body.time,
      duration: body.duration,
      status: "pending",
      notes: body.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      director:user_profiles!bookings_director_id_fkey(id, name, email, phone),
      venue:user_profiles!bookings_venue_id_fkey(id, name, email, phone, venue_name)
    `)
    .single();

  if (error) {
    throw new ApiError("Failed to create booking", 500);
  }

  // Send notifications to director and venue
  if (booking.director_id) {
    await sendNotification(
      booking.director_id,
      "booking",
      "New Booking Request",
      `You have a new booking request for ${body.service_type} on ${body.date}`,
      { booking_id: booking.id }
    );
  }

  if (booking.venue_id) {
    await sendNotification(
      booking.venue_id,
      "booking",
      "New Booking Request",
      `You have a new venue booking request for ${body.date}`,
      { booking_id: booking.id }
    );
  }

  return createSuccessResponse(booking, "Booking created successfully");
}

export const GET_Handler = withErrorHandling(GET);
export const POST_Handler = withErrorHandling(POST);
export { GET_Handler as GET, POST_Handler as POST };