import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireAuth,
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
  ApiError,
  validateRequiredFields,
  getUserProfile,
  sendNotification
} from "@/lib/api-utils";
import { RefundRequest } from "@/types/api";

async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(request);
  const { id } = await params;
  const paymentId = id;
  const body: RefundRequest = await request.json();

  const profile = await getUserProfile(session.user.email!);
  if (!profile) {
    throw new ApiError("Profile not found", 404);
  }

  // Get payment details
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select(`
      *,
      booking:bookings!payments_booking_id_fkey(
        id, service_type, date, time, status, family_id, director_id, venue_id,
        family:user_profiles!bookings_family_id_fkey(id, name, email),
        director:user_profiles!bookings_director_id_fkey(id, name, email),
        venue:user_profiles!bookings_venue_id_fkey(id, name, venue_name)
      ),
      splits:payment_splits(*),
      existing_refunds:payment_refunds(*)
    `)
    .eq("id", paymentId)
    .single();

  if (paymentError || !payment) {
    throw new ApiError("Payment not found", 404);
  }

  // Check if user has permission to refund
  const canRefund = 
    payment.booking.family_id === profile.id || // Family can request refund
    payment.booking.director_id === profile.id || // Director can issue refund
    payment.booking.venue_id === profile.id; // Venue can issue refund

  if (!canRefund) {
    throw new ApiError("Access denied - cannot refund this payment", 403);
  }

  // Check if payment is refundable
  if (payment.status !== "completed") {
    throw new ApiError("Can only refund completed payments", 400);
  }

  // Calculate refund amount
  const existingRefunds = payment.existing_refunds || [];
  const totalRefunded = existingRefunds.reduce((sum: number, refund: any) => sum + refund.amount, 0);
  const availableForRefund = payment.amount - totalRefunded;

  if (availableForRefund <= 0) {
    throw new ApiError("Payment has already been fully refunded", 400);
  }

  // Determine refund amount
  const refundAmount = body.amount && body.amount <= availableForRefund 
    ? body.amount 
    : availableForRefund;

  if (refundAmount <= 0) {
    throw new ApiError("Invalid refund amount", 400);
  }

  // Check refund timing rules
  const paymentDate = new Date(payment.created_at);
  const daysSincePayment = (Date.now() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Different refund rules based on user type and timing
  let refundPolicy = getRefundPolicy(profile.user_type, daysSincePayment, payment.booking.status);
  
  if (!refundPolicy.allowed) {
    throw new ApiError(refundPolicy.reason, 400);
  }

  // Apply refund fees if applicable
  const refundFeePercentage = refundPolicy.feePercentage || 0;
  const refundFee = Math.round(refundAmount * refundFeePercentage * 100) / 100;
  const netRefundAmount = refundAmount - refundFee;

  // Process refund with payment provider (mock implementation)
  const refundResult = await simulateRefundProcessing(
    payment.provider_payment_id,
    refundAmount
  );

  if (!refundResult.success) {
    throw new ApiError(refundResult.error || "Refund processing failed", 500);
  }

  // Create refund record
  const { data: refund, error: refundError } = await supabase
    .from("payment_refunds")
    .insert({
      payment_id: paymentId,
      amount: refundAmount,
      fee: refundFee,
      net_amount: netRefundAmount,
      reason: body.reason || "Customer request",
      provider_refund_id: refundResult.provider_refund_id,
      status: "completed",
      processed_by: profile.id,
      processed_by_type: profile.user_type,
      processed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (refundError) {
    throw new ApiError("Failed to create refund record", 500);
  }

  // Update payment status
  const newTotalRefunded = totalRefunded + refundAmount;
  const newPaymentStatus = newTotalRefunded >= payment.amount ? "refunded" : "partial_refunded";

  const { error: updateError } = await supabase
    .from("payments")
    .update({
      status: newPaymentStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", paymentId);

  if (updateError) {
    console.error("Failed to update payment status:", updateError);
  }

  // Update payment splits to reflect refunds
  if (payment.splits && payment.splits.length > 0) {
    await redistributeRefundedAmount(payment.splits, refundAmount);
  }

  // Send notifications
  const notificationMessage = `Refund of €${refundAmount} has been processed for your payment`;
  
  // Notify family
  await sendNotification(
    payment.booking.family_id,
    "payment",
    "Refund Processed",
    notificationMessage,
    {
      payment_id: paymentId,
      refund_id: refund.id,
      refund_amount: refundAmount,
      net_amount: netRefundAmount,
      reason: body.reason,
      processed_by: profile.name
    }
  );

  // Notify other stakeholders
  const stakeholders = [payment.booking.director_id, payment.booking.venue_id]
    .filter(id => id && id !== profile.id);

  for (const stakeholderId of stakeholders) {
    await sendNotification(
      stakeholderId!,
      "payment",
      "Payment Refunded",
      `A refund of €${refundAmount} has been processed for booking on ${payment.booking.date}`,
      {
        payment_id: paymentId,
        refund_id: refund.id,
        refund_amount: refundAmount,
        booking_id: payment.booking_id,
        processed_by: profile.name
      }
    );
  }

  // Get updated payment with refund details
  const { data: updatedPayment } = await supabase
    .from("payments")
    .select(`
      *,
      booking:bookings!payments_booking_id_fkey(
        id, service_type, date, status,
        family:user_profiles!bookings_family_id_fkey(id, name),
        director:user_profiles!bookings_director_id_fkey(id, name),
        venue:user_profiles!bookings_venue_id_fkey(id, name, venue_name)
      ),
      splits:payment_splits(*),
      refunds:payment_refunds(*)
    `)
    .eq("id", paymentId)
    .single();

  return createSuccessResponse({
    payment: updatedPayment,
    refund: {
      ...refund,
      policy_applied: refundPolicy
    }
  }, "Refund processed successfully");
}

function getRefundPolicy(
  userType: string, 
  daysSincePayment: number, 
  bookingStatus: string
): { allowed: boolean; reason?: string; feePercentage?: number } {
  // Family refund policies
  if (userType === "family") {
    if (bookingStatus === "completed") {
      if (daysSincePayment <= 1) {
        return { allowed: true, feePercentage: 0 }; // Full refund within 24 hours
      } else if (daysSincePayment <= 7) {
        return { allowed: true, feePercentage: 0.1 }; // 10% fee within 7 days
      } else {
        return { 
          allowed: false, 
          reason: "Refunds not allowed more than 7 days after completed service" 
        };
      }
    } else {
      if (daysSincePayment <= 30) {
        return { allowed: true, feePercentage: 0.05 }; // 5% fee for non-completed bookings
      } else {
        return { 
          allowed: false, 
          reason: "Refunds not allowed more than 30 days after payment" 
        };
      }
    }
  }

  // Director and venue refund policies (more lenient)
  if (userType === "director" || userType === "venue") {
    if (daysSincePayment <= 90) {
      return { allowed: true, feePercentage: 0.03 }; // 3% processing fee
    } else {
      return { 
        allowed: false, 
        reason: "Refunds not allowed more than 90 days after payment" 
      };
    }
  }

  return { allowed: false, reason: "Invalid user type for refund" };
}

async function redistributeRefundedAmount(splits: any[], refundAmount: number) {
  // Calculate proportional refund amounts for each split
  const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
  
  for (const split of splits) {
    const proportionalRefund = (split.amount / totalSplitAmount) * refundAmount;
    const newAmount = split.amount - proportionalRefund;
    
    await supabase
      .from("payment_splits")
      .update({
        amount: Math.max(0, newAmount),
        refunded_amount: (split.refunded_amount || 0) + proportionalRefund,
        updated_at: new Date().toISOString()
      })
      .eq("id", split.id);
  }
}

async function simulateRefundProcessing(
  providerPaymentId?: string,
  amount?: number
): Promise<{ success: boolean; provider_refund_id?: string; error?: string }> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Simulate 98% success rate for refunds
  if (Math.random() < 0.98) {
    return {
      success: true,
      provider_refund_id: `refund_${Date.now()}_${Math.random().toString(36).substring(7)}`
    };
  } else {
    return {
      success: false,
      error: "Refund processing failed at payment provider"
    };
  }
}

export const POST_Handler = withErrorHandling(POST);
export { POST_Handler as POST };