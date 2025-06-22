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
  const session = await requireUserType(request, ["director"]);
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
      venue:user_profiles!bookings_venue_id_fkey(id, name, venue_name),
      payments(*)
    `)
    .eq("director_id", profile.id)
    .gte("created_at", fromDate.toISOString())
    .lte("created_at", toDate.toISOString());

  if (bookingsError) {
    throw new ApiError("Failed to fetch bookings data", 500);
  }

  // Get clients data
  const { data: clients, error: clientsError } = await supabase
    .from("director_clients")
    .select(`
      *,
      family:user_profiles!director_clients_family_id_fkey(id, name, created_at)
    `)
    .eq("director_id", profile.id);

  if (clientsError) {
    throw new ApiError("Failed to fetch clients data", 500);
  }

  // Calculate metrics
  const totalBookings = bookings?.length || 0;
  const completedBookings = bookings?.filter(b => b.status === "completed").length || 0;
  const cancelledBookings = bookings?.filter(b => b.status === "cancelled").length || 0;
  const pendingBookings = bookings?.filter(b => b.status === "pending").length || 0;
  
  const totalRevenue = bookings?.reduce((sum, booking) => {
    const payments = booking.payments || [];
    return sum + payments.reduce((paySum: number, payment: any) => 
      payment.status === "completed" ? paySum + payment.amount : paySum, 0);
  }, 0) || 0;

  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  
  const totalClients = clients?.filter(c => c.relationship_status === "active").length || 0;
  const newClientsThisPeriod = clients?.filter(c => 
    new Date(c.created_at) >= fromDate && new Date(c.created_at) <= toDate
  ).length || 0;

  // Calculate previous period for comparison
  const previousPeriodStart = new Date(fromDate.getTime() - (toDate.getTime() - fromDate.getTime()));
  const previousPeriodEnd = fromDate;

  const { data: previousBookings } = await supabase
    .from("bookings")
    .select("id, status, price, created_at")
    .eq("director_id", profile.id)
    .gte("created_at", previousPeriodStart.toISOString())
    .lte("created_at", previousPeriodEnd.toISOString());

  const previousTotalBookings = previousBookings?.length || 0;
  const previousRevenue = previousBookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0;

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

  // Service types distribution
  const serviceTypes = aggregateMetrics(bookings || [], "service_type");
  
  charts.push({
    type: "doughnut",
    title: "Service Types Distribution",
    data: {
      labels: Object.keys(serviceTypes),
      datasets: [{
        label: "Bookings",
        data: Object.values(serviceTypes),
        backgroundColor: [
          "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"
        ]
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
    pending: pendingBookings,
    cancelled: cancelledBookings
  };

  charts.push({
    type: "pie",
    title: "Booking Status Distribution",
    data: {
      labels: ["Completed", "Pending", "Cancelled"],
      datasets: [{
        label: "Bookings",
        data: Object.values(statusDistribution),
        backgroundColor: ["#10B981", "#F59E0B", "#EF4444"]
      }]
    }
  });

  const analyticsData: AnalyticsData = {
    period,
    metrics: {
      total_bookings: totalBookings,
      completed_bookings: completedBookings,
      pending_bookings: pendingBookings,
      cancelled_bookings: cancelledBookings,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      average_booking_value: Math.round(averageBookingValue * 100) / 100,
      total_clients: totalClients,
      new_clients: newClientsThisPeriod,
      completion_rate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0,
      cancellation_rate: totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0,
      client_retention_rate: 85 // This would be calculated based on repeat bookings
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

export const GET_Handler = withErrorHandling(GET);
export { GET_Handler as GET };