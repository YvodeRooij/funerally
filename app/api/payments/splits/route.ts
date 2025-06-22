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
  sendNotification
} from "@/lib/api-utils";

async function GET(request: NextRequest) {
  const session = await requireAuth(request);
  const { page, limit } = parsePaginationParams(request);
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get("status");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const paymentId = searchParams.get("payment_id");

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Only directors and venues can view payment splits
  if (!["director", "venue"].includes(profile.user_type)) {
    throw new ApiError("Access denied - only service providers can view payment splits", 403);
  }

  let query = supabase
    .from("payment_splits")
    .select(`
      *,
      payment:payments!payment_splits_payment_id_fkey(
        id, amount, status, created_at,
        booking:bookings!payments_booking_id_fkey(
          id, service_type, date, time, status,
          family:user_profiles!bookings_family_id_fkey(id, name, email)
        )
      )
    `, { count: "exact" })
    .eq("recipient_id", profile.id)
    .order("created_at", { ascending: false });

  // Apply filters
  if (status) {
    query = query.eq("status", status);
  }

  if (paymentId) {
    query = query.eq("payment_id", paymentId);
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

  const { data: splits, error, count } = await query;

  if (error) {
    throw new ApiError("Failed to fetch payment splits", 500);
  }

  // Calculate split statistics
  const totalAmount = splits?.reduce((sum, split) => sum + split.amount, 0) || 0;
  const paidAmount = splits?.filter(s => s.status === "paid")
    .reduce((sum, split) => sum + split.amount, 0) || 0;
  const pendingAmount = splits?.filter(s => s.status === "pending")
    .reduce((sum, split) => sum + split.amount, 0) || 0;
  const refundedAmount = splits?.reduce((sum, split) => sum + (split.refunded_amount || 0), 0) || 0;

  const stats = {
    total_splits: count || 0,
    total_amount: Math.round(totalAmount * 100) / 100,
    paid_amount: Math.round(paidAmount * 100) / 100,
    pending_amount: Math.round(pendingAmount * 100) / 100,
    refunded_amount: Math.round(refundedAmount * 100) / 100,
    net_amount: Math.round((totalAmount - refundedAmount) * 100) / 100
  };

  const pagination = createPaginationInfo(page, limit, count || 0);

  return createSuccessResponse({
    splits: splits || [],
    stats,
    user_role: profile.user_type,
    filters: {
      status, payment_id: paymentId, start_date: startDate, end_date: endDate
    }
  }, "Payment splits retrieved successfully", pagination);
}

async function PUT(request: NextRequest) {
  const session = await requireUserType(request, ["director", "venue"]);
  const body = await request.json();
  
  const { split_ids, action } = body;

  if (!split_ids || !Array.isArray(split_ids) || split_ids.length === 0) {
    throw new ApiError("split_ids array is required", 400);
  }

  if (!["mark_paid", "request_payout"].includes(action)) {
    throw new ApiError("Invalid action. Must be 'mark_paid' or 'request_payout'", 400);
  }

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Get splits to update
  const { data: splits, error: splitsError } = await supabase
    .from("payment_splits")
    .select(`
      *,
      payment:payments!payment_splits_payment_id_fkey(
        id, status,
        booking:bookings!payments_booking_id_fkey(id, service_type, date)
      )
    `)
    .in("id", split_ids)
    .eq("recipient_id", profile.id);

  if (splitsError || !splits || splits.length === 0) {
    throw new ApiError("No valid splits found", 404);
  }

  // Validate all splits belong to this user
  const invalidSplits = splits.filter(split => split.recipient_id !== profile.id);
  if (invalidSplits.length > 0) {
    throw new ApiError("Access denied - can only update your own splits", 403);
  }

  // Validate splits can be updated
  const nonPendingSplits = splits.filter(split => split.status !== "pending");
  if (action === "mark_paid" && nonPendingSplits.length > 0) {
    throw new ApiError("Can only mark pending splits as paid", 400);
  }

  // Validate payment status
  const invalidPaymentSplits = splits.filter(split => 
    !["completed", "partial_refunded"].includes(split.payment.status)
  );
  if (invalidPaymentSplits.length > 0) {
    throw new ApiError("Can only update splits for completed payments", 400);
  }

  let newStatus: string;
  let updateData: any = {
    updated_at: new Date().toISOString()
  };

  switch (action) {
    case "mark_paid":
      newStatus = "paid";
      updateData.status = newStatus;
      updateData.paid_at = new Date().toISOString();
      break;
    
    case "request_payout":
      newStatus = "payout_requested";
      updateData.status = newStatus;
      updateData.payout_requested_at = new Date().toISOString();
      break;
    
    default:
      throw new ApiError("Invalid action", 400);
  }

  // Update splits
  const { data: updatedSplits, error: updateError } = await supabase
    .from("payment_splits")
    .update(updateData)
    .in("id", split_ids)
    .eq("recipient_id", profile.id)
    .select(`
      *,
      payment:payments!payment_splits_payment_id_fkey(
        id, amount,
        booking:bookings!payments_booking_id_fkey(
          id, service_type, date,
          family:user_profiles!bookings_family_id_fkey(id, name, email)
        )
      )
    `);

  if (updateError) {
    throw new ApiError("Failed to update payment splits", 500);
  }

  // Send notifications based on action
  if (action === "request_payout") {
    // Notify platform admin about payout request
    const totalPayoutAmount = updatedSplits?.reduce((sum, split) => sum + split.amount, 0) || 0;
    
    // This would typically send to platform admin users
    console.log(`Payout request: ${profile.name} requested €${totalPayoutAmount} payout`);
    
    // Notify the user
    await sendNotification(
      profile.id,
      "payment",
      "Payout Requested",
      `Your payout request for €${totalPayoutAmount} has been submitted and will be processed within 3-5 business days`,
      {
        split_ids,
        total_amount: totalPayoutAmount,
        estimated_processing_days: "3-5"
      }
    );
  }

  const responseMessage = action === "mark_paid" 
    ? "Payment splits marked as paid successfully"
    : "Payout request submitted successfully";

  return createSuccessResponse({
    updated_splits: updatedSplits,
    action,
    total_amount: updatedSplits?.reduce((sum, split) => sum + split.amount, 0) || 0
  }, responseMessage);
}

export const GET_Handler = withErrorHandling(GET);
export const PUT_Handler = withErrorHandling(PUT);
export { GET_Handler as GET, PUT_Handler as PUT };