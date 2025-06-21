import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireAuth,
  requireUserType,
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
  ApiError,
  getUserProfile,
  aggregateMetrics,
  calculateGrowthRate
} from "@/lib/api-utils";
import { AnalyticsData, ChartData } from "@/types/api";

async function GET(request: NextRequest) {
  const session = await requireUserType(request, ["venue"]);
  const { searchParams } = new URL(request.url);
  
  const period = searchParams.get("period") || "month";
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const metric = searchParams.get("metric");

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Calculate date range
  const now = new Date();
  let fromDate: Date;
  let toDate = new Date(now);

  switch (period) {
    case "week":
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter":
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      fromDate = new Date(now.getFullYear(), quarterStart, 1);
      break;
    case "year":
      fromDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "custom":
      fromDate = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      toDate = endDate ? new Date(endDate) : now;
      break;
    default:
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Get bookings data
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(`
      *,
      family:user_profiles!bookings_family_id_fkey(id, name, email),
      director:user_profiles!bookings_director_id_fkey(id, name, email, company),
      payments(*)
    `)
    .eq("venue_id", profile.id)
    .gte("created_at", fromDate.toISOString())
    .lte("created_at", toDate.toISOString());

  if (bookingsError) {
    throw new ApiError("Failed to fetch bookings data", 500);
  }

  // Get availability data
  const { data: availability, error: availabilityError } = await supabase
    .from("venue_availability")
    .select("*")
    .eq("venue_id", profile.id)
    .gte("date", fromDate.toISOString().split("T")[0])
    .lte("date", toDate.toISOString().split("T")[0]);

  if (availabilityError) {
    throw new ApiError("Failed to fetch availability data", 500);
  }

  // Get venue reviews
  const { data: reviews, error: reviewsError } = await supabase
    .from("venue_reviews")
    .select(`
      *,
      reviewer:user_profiles!venue_reviews_reviewer_id_fkey(id, name, user_type)
    `)
    .eq("venue_id", profile.id)
    .gte("created_at", fromDate.toISOString());

  if (reviewsError) {
    console.error("Failed to fetch reviews:", reviewsError);
    // Don't fail the entire request for reviews
  }

  // Calculate metrics
  const totalBookings = bookings?.length || 0;
  const completedBookings = bookings?.filter(b => b.status === "completed").length || 0;
  const cancelledBookings = bookings?.filter(b => b.status === "cancelled").length || 0;
  const pendingBookings = bookings?.filter(b => b.status === "pending").length || 0;
  const confirmedBookings = bookings?.filter(b => b.status === "confirmed").length || 0;

  const totalRevenue = bookings?.reduce((sum, booking) => {
    const payments = booking.payments || [];
    return sum + payments.reduce((paySum: number, payment: any) =>
      payment.status === "completed" ? paySum + payment.amount : paySum, 0);
  }, 0) || 0;

  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  // Calculate availability metrics
  const totalTimeSlots = availability?.reduce((sum, day) => 
    sum + (day.time_slots?.length || 0), 0) || 0;
  
  const availableTimeSlots = availability?.reduce((sum, day) => 
    sum + (day.time_slots?.filter((slot: any) => slot.is_available).length || 0), 0) || 0;
  
  const bookedTimeSlots = availability?.reduce((sum, day) => 
    sum + (day.time_slots?.filter((slot: any) => slot.booking_id).length || 0), 0) || 0;

  const utilizationRate = totalTimeSlots > 0 ? (bookedTimeSlots / totalTimeSlots) * 100 : 0;

  // Calculate review metrics
  const totalReviews = reviews?.length || 0;
  const averageRating = totalReviews > 0 
    ? reviews!.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0;

  // Get unique clients (directors and families)
  const uniqueDirectors = new Set(bookings?.map(b => b.director_id).filter(Boolean)).size;
  const uniqueFamilies = new Set(bookings?.map(b => b.family_id).filter(Boolean)).size;

  // Calculate previous period for comparison
  const previousPeriodStart = new Date(fromDate.getTime() - (toDate.getTime() - fromDate.getTime()));
  const previousPeriodEnd = fromDate;

  const { data: previousBookings } = await supabase
    .from("bookings")
    .select("id, status, created_at, payments(*)")
    .eq("venue_id", profile.id)
    .gte("created_at", previousPeriodStart.toISOString())
    .lte("created_at", previousPeriodEnd.toISOString());

  const previousTotalBookings = previousBookings?.length || 0;
  const previousRevenue = previousBookings?.reduce((sum, booking) => {
    const payments = booking.payments || [];
    return sum + payments.reduce((paySum: number, payment: any) =>
      payment.status === "completed" ? paySum + payment.amount : paySum, 0);
  }, 0) || 0;

  // Generate charts data
  const charts: ChartData[] = [];

  // Bookings over time chart
  const bookingsByDate = aggregateMetrics(
    bookings?.map(b => ({
      ...b,
      date: new Date(b.created_at).toLocaleDateString()
    })) || [],
    "date"
  );

  charts.push({
    type: "line",
    title: "Bookings Over Time",
    data: {
      labels: Object.keys(bookingsByDate),
      datasets: [{
        label: "Bookings",
        data: Object.values(bookingsByDate),
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)"
      }]
    }
  });

  // Revenue by month (if period allows)
  if (period === "year" || period === "quarter") {
    const revenueByMonth = bookings?.reduce((acc: any, booking) => {
      const month = new Date(booking.created_at).toLocaleDateString("en-US", { month: "short" });
      const payments = booking.payments || [];
      const revenue = payments.reduce((sum: number, p: any) =>
        p.status === "completed" ? sum + p.amount : sum, 0);
      acc[month] = (acc[month] || 0) + revenue;
      return acc;
    }, {}) || {};

    charts.push({
      type: "bar",
      title: "Revenue by Month",
      data: {
        labels: Object.keys(revenueByMonth),
        datasets: [{
          label: "Revenue (€)",
          data: Object.values(revenueByMonth),
          backgroundColor: "#10B981"
        }]
      }
    });
  }

  // Booking status distribution
  const statusDistribution = {
    completed: completedBookings,
    confirmed: confirmedBookings,
    pending: pendingBookings,
    cancelled: cancelledBookings
  };

  charts.push({
    type: "doughnut",
    title: "Booking Status Distribution",
    data: {
      labels: ["Completed", "Confirmed", "Pending", "Cancelled"],
      datasets: [{
        label: "Bookings",
        data: Object.values(statusDistribution),
        backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"]
      }]
    }
  });

  // Utilization rate over time
  const utilizationByDay = availability?.map(day => ({
    date: day.date,
    utilization: day.time_slots?.length > 0 
      ? (day.time_slots.filter((slot: any) => slot.booking_id).length / day.time_slots.length) * 100
      : 0
  })) || [];

  if (utilizationByDay.length > 0) {
    charts.push({
      type: "line",
      title: "Daily Utilization Rate",
      data: {
        labels: utilizationByDay.map(d => d.date),
        datasets: [{
          label: "Utilization %",
          data: utilizationByDay.map(d => d.utilization),
          borderColor: "#8B5CF6",
          backgroundColor: "rgba(139, 92, 246, 0.1)"
        }]
      }
    });
  }

  // Client types distribution
  const clientTypes = bookings?.reduce((acc: any, booking) => {
    if (booking.director_id) acc.directors = (acc.directors || 0) + 1;
    if (booking.family_id && !booking.director_id) acc.families = (acc.families || 0) + 1;
    return acc;
  }, {}) || {};

  if (Object.keys(clientTypes).length > 0) {
    charts.push({
      type: "pie",
      title: "Client Types",
      data: {
        labels: Object.keys(clientTypes).map(key => 
          key === "directors" ? "Via Directors" : "Direct Families"
        ),
        datasets: [{
          label: "Bookings",
          data: Object.values(clientTypes),
          backgroundColor: ["#06B6D4", "#F59E0B"]
        }]
      }
    });
  }

  const analyticsData: AnalyticsData = {
    period,
    metrics: {
      total_bookings: totalBookings,
      completed_bookings: completedBookings,
      confirmed_bookings: confirmedBookings,
      pending_bookings: pendingBookings,
      cancelled_bookings: cancelledBookings,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      average_booking_value: Math.round(averageBookingValue * 100) / 100,
      utilization_rate: Math.round(utilizationRate * 100) / 100,
      total_time_slots: totalTimeSlots,
      available_time_slots: availableTimeSlots,
      booked_time_slots: bookedTimeSlots,
      unique_directors: uniqueDirectors,
      unique_families: uniqueFamilies,
      total_reviews: totalReviews,
      average_rating: Math.round(averageRating * 10) / 10,
      completion_rate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0,
      cancellation_rate: totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0,
      repeat_client_rate: 75 // This would be calculated based on returning clients
    },
    comparisons: {
      bookings_growth: calculateGrowthRate(totalBookings, previousTotalBookings),
      revenue_growth: calculateGrowthRate(totalRevenue, previousRevenue)
    },
    charts
  };

  // If specific metric requested, filter response
  if (metric) {
    const specificMetric = {
      period,
      metric_name: metric,
      value: analyticsData.metrics[metric],
      growth: analyticsData.comparisons[`${metric}_growth`] || 0,
      chart: charts.find(c => c.title.toLowerCase().includes(metric.toLowerCase()))
    };
    
    return createSuccessResponse(specificMetric, `${metric} analytics retrieved successfully`);
  }

  return createSuccessResponse(analyticsData, "Analytics data retrieved successfully");
}

export { 
  withErrorHandling(GET) as GET
};