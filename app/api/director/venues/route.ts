import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireAuth,
  requireUserType,
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
  ApiError,
  parsePaginationParams,
  createPaginationInfo,
  getUserProfile,
  buildSearchQuery
} from "@/lib/api-utils";

async function GET(request: NextRequest) {
  const session = await requireUserType(request, ["director"]);
  const { page, limit } = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const search = searchParams.get("search");
  const location = searchParams.get("location");
  const venueType = searchParams.get("venue_type");
  const minCapacity = searchParams.get("min_capacity");
  const maxCapacity = searchParams.get("max_capacity");
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const amenities = searchParams.get("amenities");
  const available = searchParams.get("available") === "true";
  const date = searchParams.get("date");
  const sortBy = searchParams.get("sort_by") || "name";
  const sortOrder = searchParams.get("sort_order") || "asc";

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  let query = supabase
    .from("user_profiles")
    .select(`
      *,
      venue_availability:venue_availability!venue_availability_venue_id_fkey(
        date, time_slots
      ),
      bookings:bookings!bookings_venue_id_fkey(
        id, date, time, status, 
        count() as booking_count
      ),
      reviews:venue_reviews(
        id, rating, comment, created_at,
        reviewer:user_profiles!venue_reviews_reviewer_id_fkey(name, user_type)
      )
    `, { count: "exact" })
    .eq("user_type", "venue")
    .eq("status", "active")
    .order(sortBy, { ascending: sortOrder === "asc" });

  // Apply search filters
  if (search) {
    query = buildSearchQuery(
      query,
      search,
      ["name", "venue_name", "company", "address"]
    );
  }

  if (location) {
    query = query.ilike("address", `%${location}%`);
  }

  if (venueType) {
    query = query.eq("venue_type", venueType);
  }

  if (minCapacity) {
    query = query.gte("capacity", parseInt(minCapacity));
  }

  if (maxCapacity) {
    query = query.lte("capacity", parseInt(maxCapacity));
  }

  if (minPrice) {
    query = query.gte("price_per_hour", parseFloat(minPrice));
  }

  if (maxPrice) {
    query = query.lte("price_per_hour", parseFloat(maxPrice));
  }

  if (amenities) {
    const amenityList = amenities.split(",");
    query = query.overlaps("amenities", amenityList);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: venues, error, count } = await query;

  if (error) {
    throw new ApiError("Failed to fetch venues", 500);
  }

  // Enhance venues with additional data
  const enhancedVenues = await Promise.all(
    venues?.map(async (venue) => {
      // Calculate average rating
      const avgRating = venue.reviews?.reduce((sum: number, review: any) => 
        sum + review.rating, 0) / (venue.reviews?.length || 1);

      // Check availability for specific date if requested
      let isAvailable = true;
      if (available && date) {
        const { data: availability } = await supabase
          .from("venue_availability")
          .select("time_slots")
          .eq("venue_id", venue.id)
          .eq("date", date)
          .single();

        isAvailable = availability?.time_slots?.some(
          (slot: any) => slot.is_available
        ) || false;
      }

      // Get booking statistics
      const { data: bookingStats } = await supabase
        .from("bookings")
        .select("status, created_at")
        .eq("venue_id", venue.id)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const stats = {
        total_bookings: bookingStats?.length || 0,
        completed_bookings: bookingStats?.filter(b => b.status === "completed").length || 0,
        this_month_bookings: bookingStats?.length || 0,
        response_rate: 95, // This would be calculated based on actual response data
        avg_rating: parseFloat(avgRating.toFixed(1)) || 0,
        total_reviews: venue.reviews?.length || 0
      };

      return {
        ...venue,
        is_available: isAvailable,
        stats,
        distance: calculateDistance(profile.address, venue.address) // Simplified distance calculation
      };
    }) || []
  );

  // Filter by availability if requested
  const filteredVenues = available && date 
    ? enhancedVenues.filter(v => v.is_available)
    : enhancedVenues;

  const pagination = createPaginationInfo(page, limit, count || 0);

  // Get filter options for frontend
  const { data: filterOptions } = await supabase
    .from("user_profiles")
    .select("venue_type, amenities")
    .eq("user_type", "venue")
    .eq("status", "active");

  const uniqueVenueTypes = [...new Set(filterOptions?.map(v => v.venue_type).filter(Boolean))];
  const uniqueAmenities = [...new Set(
    filterOptions?.flatMap(v => v.amenities || []).filter(Boolean)
  )];

  return createSuccessResponse({
    venues: filteredVenues,
    pagination,
    filters: {
      venue_types: uniqueVenueTypes,
      amenities: uniqueAmenities,
      applied_filters: {
        search, location, venue_type: venueType, min_capacity: minCapacity,
        max_capacity: maxCapacity, min_price: minPrice, max_price: maxPrice,
        amenities, available, date, sort_by: sortBy, sort_order: sortOrder
      }
    }
  }, "Venues retrieved successfully");
}

// Simplified distance calculation (in real app, use proper geolocation)
function calculateDistance(address1?: string, address2?: string): number {
  if (!address1 || !address2) return 0;
  
  // This is a placeholder - in a real app, you'd use a proper geolocation service
  // to calculate actual distances between addresses
  return Math.floor(Math.random() * 50) + 1; // Random distance between 1-50 km
}

export const GET_Handler = withErrorHandling(GET);
export { GET_Handler as GET };