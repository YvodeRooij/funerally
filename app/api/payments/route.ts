import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireAuth,
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
  ApiError,
  validateRequiredFields,
  parsePaginationParams,
  createPaginationInfo,
  getUserProfile,
  sendNotification
} from "@/lib/api-utils";
import { ProcessPaymentRequest } from "@/types/api";

async function GET(request: NextRequest) {
  const session = await requireAuth(request);
  const { page, limit } = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get("status");
  const bookingId = searchParams.get("booking_id");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const sortBy = searchParams.get("sort_by") || "created_at";
  const sortOrder = searchParams.get("sort_order") || "desc";

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  let query = supabase
    .from("payments")
    .select(`
      *,
      booking:bookings!payments_booking_id_fkey(
        id, service_type, date, time, status,
        family:user_profiles!bookings_family_id_fkey(id, name, email),
        director:user_profiles!bookings_director_id_fkey(id, name, email, company),
        venue:user_profiles!bookings_venue_id_fkey(id, name, venue_name)
      ),
      splits:payment_splits(*),
      refunds:payment_refunds(*)
    `, { count: "exact" })
    .order(sortBy, { ascending: sortOrder === "asc" });

  // Filter based on user role and permissions
  switch (profile.user_type) {
    case "family":
      // Families can see payments for their bookings
      query = query.eq("booking.family_id", profile.id);
      break;
    case "director":
      // Directors can see payments for their bookings or where they receive splits
      query = query.or(`booking.director_id.eq.${profile.id},splits.recipient_id.eq.${profile.id}`);
      break;
    case "venue":
      // Venues can see payments for their bookings or where they receive splits
      query = query.or(`booking.venue_id.eq.${profile.id},splits.recipient_id.eq.${profile.id}`);
      break;
    default:
      throw new ApiError("Invalid user type", 403);
  }

  // Apply filters
  if (status) {
    query = query.eq("status", status);
  }

  if (bookingId) {
    query = query.eq("booking_id", bookingId);
  }

  if (startDate) {
    query = query.gte("created_at", startDate);
  }

  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: payments, error, count } = await query;

  if (error) {
    throw new ApiError("Failed to fetch payments", 500);
  }

  // Calculate payment statistics
  const totalAmount = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  const completedAmount = payments?.filter(p => p.status === "completed")
    .reduce((sum, payment) => sum + payment.amount, 0) || 0;
  const pendingAmount = payments?.filter(p => p.status === "pending")
    .reduce((sum, payment) => sum + payment.amount, 0) || 0;
  const refundedAmount = payments?.filter(p => p.status === "refunded" || p.status === "partial_refunded")
    .reduce((sum, payment) => {
      const refunds = payment.refunds || [];
      return sum + refunds.reduce((refundSum: number, refund: any) => refundSum + refund.amount, 0);
    }, 0) || 0;

  const stats = {
    total_payments: count || 0,
    total_amount: Math.round(totalAmount * 100) / 100,
    completed_amount: Math.round(completedAmount * 100) / 100,
    pending_amount: Math.round(pendingAmount * 100) / 100,
    refunded_amount: Math.round(refundedAmount * 100) / 100,
    average_payment: count ? Math.round((totalAmount / count) * 100) / 100 : 0
  };

  const pagination = createPaginationInfo(page, limit, count || 0);

  return createSuccessResponse({
    payments: payments || [],
    stats,
    user_role: profile.user_type,
    filters: {
      status, booking_id: bookingId, start_date: startDate, end_date: endDate,
      sort_by: sortBy, sort_order: sortOrder
    }
  }, "Payments retrieved successfully", pagination);
}

async function POST(request: NextRequest) {
  const session = await requireAuth(request);
  const body: ProcessPaymentRequest = await request.json();
  
  validateRequiredFields(body, ["booking_id", "amount", "payment_method"]);

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Only families can initiate payments
  if (profile.user_type !== "family") {
    throw new ApiError("Only families can process payments", 403);
  }

  // Get booking details
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(`
      *,
      family:user_profiles!bookings_family_id_fkey(id, name, email),
      director:user_profiles!bookings_director_id_fkey(id, name, email, company),
      venue:user_profiles!bookings_venue_id_fkey(id, name, venue_name)
    `)
    .eq("id", body.booking_id)
    .single();

  if (bookingError || !booking) {
    throw new ApiError("Booking not found", 404);
  }

  // Check if family owns this booking
  if (booking.family_id !== profile.id) {
    throw new ApiError("Access denied - can only pay for your own bookings", 403);
  }

  // Check if booking is in payable status
  if (!["confirmed", "completed"].includes(booking.status)) {
    throw new ApiError("Can only pay for confirmed or completed bookings", 400);
  }

  // Check if payment already exists for this booking
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id, status")
    .eq("booking_id", body.booking_id)
    .eq("status", "completed")
    .single();

  if (existingPayment) {
    throw new ApiError("Payment already completed for this booking", 400);
  }

  // Validate amount
  if (body.amount <= 0) {
    throw new ApiError("Payment amount must be greater than 0", 400);
  }

  // Prepare payment splits
  let paymentSplits = body.splits || [];
  
  // Default split logic if no splits provided
  if (paymentSplits.length === 0) {
    const platformFee = Math.round(body.amount * 0.05 * 100) / 100; // 5% platform fee
    const remainingAmount = body.amount - platformFee;

    paymentSplits.push({
      recipient_id: "platform",
      amount: platformFee,
      percentage: 5
    });

    if (booking.director_id && booking.venue_id) {
      // Split between director and venue (70/30)
      const directorAmount = Math.round(remainingAmount * 0.7 * 100) / 100;
      const venueAmount = remainingAmount - directorAmount;

      paymentSplits.push(
        {
          recipient_id: booking.director_id,
          amount: directorAmount,
          percentage: 70
        },
        {
          recipient_id: booking.venue_id,
          amount: venueAmount,
          percentage: 30
        }
      );
    } else if (booking.director_id) {
      // All to director (minus platform fee)
      paymentSplits.push({
        recipient_id: booking.director_id,
        amount: remainingAmount,
        percentage: 95
      });
    } else if (booking.venue_id) {
      // All to venue (minus platform fee)
      paymentSplits.push({
        recipient_id: booking.venue_id,
        amount: remainingAmount,
        percentage: 95
      });
    }
  }

  // Validate splits total
  const totalSplitAmount = paymentSplits.reduce((sum, split) => sum + split.amount, 0);
  if (Math.abs(totalSplitAmount - body.amount) > 0.01) {
    throw new ApiError("Payment splits must total the payment amount", 400);
  }

  // Here you would integrate with a real payment processor (Stripe, PayPal, etc.)
  // For this example, we'll simulate the payment processing
  const mockPaymentProcessing = await simulatePaymentProcessing(
    body.amount,
    body.payment_method,
    body.payment_token
  );

  if (!mockPaymentProcessing.success) {
    throw new ApiError(mockPaymentProcessing.error || "Payment processing failed", 400);
  }

  // Create payment record
  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      booking_id: body.booking_id,
      amount: body.amount,
      currency: "EUR", // Default currency
      status: mockPaymentProcessing.status,
      payment_method: body.payment_method,
      provider_payment_id: mockPaymentProcessing.provider_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new ApiError("Failed to create payment record", 500);
  }

  // Create payment splits
  if (paymentSplits.length > 0) {
    const splitRecords = paymentSplits.map(split => ({
      payment_id: payment.id,
      recipient_id: split.recipient_id,
      recipient_type: split.recipient_id === "platform" ? "platform" : 
                     booking.director_id === split.recipient_id ? "director" : "venue",
      amount: split.amount,
      percentage: split.percentage,
      status: "pending",
      created_at: new Date().toISOString()
    }));

    const { error: splitsError } = await supabase
      .from("payment_splits")
      .insert(splitRecords);

    if (splitsError) {
      console.error("Failed to create payment splits:", splitsError);
    }
  }

  // Send notifications
  if (booking.director_id) {
    await sendNotification(
      booking.director_id,
      "payment",
      "Payment Received",
      `Payment of €${body.amount} received for booking on ${booking.date}`,
      { 
        payment_id: payment.id,
        booking_id: body.booking_id,
        amount: body.amount,
        from: profile.name
      }
    );
  }

  if (booking.venue_id) {
    await sendNotification(
      booking.venue_id,
      "payment",
      "Payment Received",
      `Payment of €${body.amount} received for venue booking on ${booking.date}`,
      { 
        payment_id: payment.id,
        booking_id: body.booking_id,
        amount: body.amount,
        from: profile.name
      }
    );
  }

  // Get complete payment data with splits
  const { data: completePayment } = await supabase
    .from("payments")
    .select(`
      *,
      booking:bookings!payments_booking_id_fkey(
        id, service_type, date, status,
        family:user_profiles!bookings_family_id_fkey(id, name),
        director:user_profiles!bookings_director_id_fkey(id, name),
        venue:user_profiles!bookings_venue_id_fkey(id, name, venue_name)
      ),
      splits:payment_splits(*)
    `)
    .eq("id", payment.id)
    .single();

  return createSuccessResponse(completePayment, "Payment processed successfully");
}

// Mock payment processing function
async function simulatePaymentProcessing(
  amount: number,
  paymentMethod: string,
  paymentToken?: string
): Promise<{ success: boolean; status: string; provider_id?: string; error?: string }> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Mock different scenarios based on amount
  if (amount < 1) {
    return { success: false, status: "failed", error: "Amount too small" };
  }

  if (amount > 10000) {
    return { success: false, status: "failed", error: "Amount exceeds limit" };
  }

  // Simulate 95% success rate
  if (Math.random() < 0.95) {
    return { 
      success: true, 
      status: "completed", 
      provider_id: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`
    };
  } else {
    return { success: false, status: "failed", error: "Payment declined" };
  }
}

export const GET_Handler = withErrorHandling(GET);
export const POST_Handler = withErrorHandling(POST);
export { GET_Handler as GET, POST_Handler as POST };