/**
 * Refund and dispute handling for Farewelly marketplace
 */

import {
  RefundRequest,
  DisputeCase,
  PaymentIntent,
  PaymentResult,
  PaymentProvider,
  PaymentStatus,
  DisputeStatus,
} from './types';
import { REFUND_REASONS, DISPUTE_CATEGORIES } from './config';
import { StripePaymentService } from './stripe';
import { MolliePaymentService } from './mollie';

export interface CreateRefundRequest {
  paymentIntentId: string;
  amount?: number; // If not provided, full refund
  reason: string;
  description: string;
  initiatedBy: 'customer' | 'provider' | 'admin' | 'system';
  metadata?: Record<string, any>;
}

export interface CreateDisputeRequest {
  paymentIntentId: string;
  customerId: string;
  providerId: string;
  reason: string;
  description: string;
  evidence: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface RefundPolicy {
  timeLimit: number; // in days
  allowPartialRefunds: boolean;
  automaticRefundReasons: string[];
  requiresApproval: string[];
  nonRefundableReasons: string[];
}

export class RefundDisputeService {
  private stripeService: StripePaymentService;
  private mollieService: MolliePaymentService;
  private refundPolicy: RefundPolicy;

  constructor() {
    this.stripeService = new StripePaymentService();
    this.mollieService = new MolliePaymentService();
    this.refundPolicy = {
      timeLimit: 30, // 30 days
      allowPartialRefunds: true,
      automaticRefundReasons: [
        'duplicate_charge',
        'processing_error',
        'system_error',
      ],
      requiresApproval: [
        'service_not_provided',
        'quality_issue',
        'customer_complaint',
      ],
      nonRefundableReasons: [
        'service_completed',
        'past_time_limit',
        'fraudulent_request',
      ],
    };
  }

  /**
   * Create a refund request
   */
  async createRefund(request: CreateRefundRequest): Promise<PaymentResult<RefundRequest>> {
    try {
      // Validate refund request
      const validation = await this.validateRefundRequest(request);
      if (!validation.success) {
        return validation;
      }

      // Get payment intent details
      const paymentResult = await this.getPaymentIntent(request.paymentIntentId);
      if (!paymentResult.success || !paymentResult.data) {
        return {
          success: false,
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment intent not found',
          },
        };
      }

      const paymentIntent = paymentResult.data;

      // Check if automatic refund or requires approval
      const isAutomatic = this.refundPolicy.automaticRefundReasons.includes(request.reason);
      
      let refundResult: PaymentResult<RefundRequest>;

      if (isAutomatic) {
        // Process automatic refund
        refundResult = await this.processAutomaticRefund(paymentIntent, request);
      } else {
        // Create pending refund for approval
        refundResult = await this.createPendingRefund(paymentIntent, request);
      }

      // Log refund activity
      await this.logRefundActivity(refundResult.data!, request.initiatedBy);

      return refundResult;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REFUND_CREATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create refund',
          details: { error },
        },
      };
    }
  }

  /**
   * Process automatic refund
   */
  private async processAutomaticRefund(
    paymentIntent: PaymentIntent,
    request: CreateRefundRequest
  ): Promise<PaymentResult<RefundRequest>> {
    try {
      if (paymentIntent.provider === PaymentProvider.STRIPE) {
        return await this.stripeService.createRefund(
          request.paymentIntentId,
          request.amount,
          request.reason
        );
      } else if (paymentIntent.provider === PaymentProvider.MOLLIE) {
        return await this.mollieService.createRefund(
          request.paymentIntentId,
          request.amount,
          request.description
        );
      } else {
        throw new Error('Unsupported payment provider');
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUTOMATIC_REFUND_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process automatic refund',
          details: { error },
        },
      };
    }
  }

  /**
   * Create pending refund for approval
   */
  private async createPendingRefund(
    paymentIntent: PaymentIntent,
    request: CreateRefundRequest
  ): Promise<PaymentResult<RefundRequest>> {
    const refundRequest: RefundRequest = {
      id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentIntentId: request.paymentIntentId,
      amount: {
        amount: request.amount || paymentIntent.amount.amount,
        currency: 'EUR',
      },
      reason: request.reason,
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
    };

    // In a real implementation, this would be stored in database
    // and trigger approval workflow
    
    return { success: true, data: refundRequest };
  }

  /**
   * Approve pending refund
   */
  async approveRefund(
    refundId: string,
    approvedBy: string,
    notes?: string
  ): Promise<PaymentResult<RefundRequest>> {
    try {
      // Get pending refund details (from database)
      // Process the actual refund
      // Update status and log approval
      
      // Placeholder implementation
      const refundRequest: RefundRequest = {
        id: refundId,
        paymentIntentId: 'placeholder',
        amount: { amount: 0, currency: 'EUR' },
        reason: 'approved',
        status: PaymentStatus.COMPLETED,
        createdAt: new Date(),
        processedAt: new Date(),
      };

      return { success: true, data: refundRequest };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REFUND_APPROVAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to approve refund',
          details: { error },
        },
      };
    }
  }

  /**
   * Create a dispute case
   */
  async createDispute(request: CreateDisputeRequest): Promise<PaymentResult<DisputeCase>> {
    try {
      const disputeCase: DisputeCase = {
        id: `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paymentIntentId: request.paymentIntentId,
        customerId: request.customerId,
        providerId: request.providerId,
        reason: request.reason,
        description: request.description,
        evidence: request.evidence,
        status: DisputeStatus.SUBMITTED,
        createdAt: new Date(),
      };

      // Auto-assign based on priority
      if (request.priority === 'urgent') {
        disputeCase.status = DisputeStatus.ESCALATED;
      }

      // Log dispute creation
      await this.logDisputeActivity(disputeCase, 'created');

      // Notify relevant parties
      await this.notifyDisputeParties(disputeCase);

      return { success: true, data: disputeCase };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DISPUTE_CREATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create dispute',
          details: { error },
        },
      };
    }
  }

  /**
   * Handle chargeback from payment provider
   */
  async handleChargeback(
    paymentIntentId: string,
    chargebackData: any,
    provider: PaymentProvider
  ): Promise<PaymentResult<DisputeCase>> {
    try {
      // Create dispute case from chargeback
      const disputeCase: DisputeCase = {
        id: `chargeback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paymentIntentId,
        customerId: chargebackData.customerId || '',
        providerId: chargebackData.providerId || '',
        reason: 'chargeback',
        description: `Chargeback initiated: ${chargebackData.reason || 'No reason provided'}`,
        evidence: [],
        status: DisputeStatus.UNDER_REVIEW,
        createdAt: new Date(),
      };

      // Auto-collect evidence
      const evidence = await this.collectChargebackEvidence(paymentIntentId);
      disputeCase.evidence = evidence;

      // Notify provider to respond
      await this.notifyProviderChargeback(disputeCase);

      return { success: true, data: disputeCase };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CHARGEBACK_HANDLING_ERROR',
          message: error instanceof Error ? error.message : 'Failed to handle chargeback',
          details: { error },
        },
      };
    }
  }

  /**
   * Resolve dispute case
   */
  async resolveDispute(
    disputeId: string,
    resolution: string,
    resolvedBy: string,
    refundAmount?: number
  ): Promise<PaymentResult<DisputeCase>> {
    try {
      // Get dispute case
      // Apply resolution
      // Process any refunds if needed
      // Update status and notify parties

      const resolvedDispute: DisputeCase = {
        id: disputeId,
        paymentIntentId: 'placeholder',
        customerId: 'placeholder',
        providerId: 'placeholder',
        reason: 'resolved',
        description: 'Dispute resolved',
        evidence: [],
        status: DisputeStatus.RESOLVED,
        resolution,
        createdAt: new Date(),
        resolvedAt: new Date(),
      };

      // Process refund if part of resolution
      if (refundAmount && refundAmount > 0) {
        await this.createRefund({
          paymentIntentId: resolvedDispute.paymentIntentId,
          amount: refundAmount,
          reason: 'dispute_resolution',
          description: `Refund as part of dispute resolution: ${disputeId}`,
          initiatedBy: 'admin',
        });
      }

      return { success: true, data: resolvedDispute };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DISPUTE_RESOLUTION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to resolve dispute',
          details: { error },
        },
      };
    }
  }

  /**
   * Get refund analytics
   */
  async getRefundAnalytics(period: { start: Date; end: Date }): Promise<PaymentResult<{
    totalRefunds: number;
    totalRefundAmount: number;
    refundRate: number;
    topRefundReasons: Array<{ reason: string; count: number; amount: number }>;
    averageRefundTime: number; // in hours
    automaticRefundRate: number;
  }>> {
    try {
      // In a real implementation, this would query the database
      // For now, return mock data
      
      const analytics = {
        totalRefunds: 45,
        totalRefundAmount: 125000, // €1,250.00
        refundRate: 0.023, // 2.3%
        topRefundReasons: [
          { reason: 'service_not_provided', count: 15, amount: 45000 },
          { reason: 'quality_issue', count: 12, amount: 38000 },
          { reason: 'processing_error', count: 8, amount: 24000 },
          { reason: 'duplicate_charge', count: 6, amount: 18000 },
        ],
        averageRefundTime: 18.5, // 18.5 hours
        automaticRefundRate: 0.35, // 35% of refunds are automatic
      };

      return { success: true, data: analytics };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REFUND_ANALYTICS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get refund analytics',
          details: { error },
        },
      };
    }
  }

  private async validateRefundRequest(
    request: CreateRefundRequest
  ): Promise<PaymentResult<boolean>> {
    // Check if reason is valid
    if (!REFUND_REASONS.includes(request.reason as any)) {
      return {
        success: false,
        error: {
          code: 'INVALID_REFUND_REASON',
          message: 'Invalid refund reason provided',
        },
      };
    }

    // Check if reason is non-refundable
    if (this.refundPolicy.nonRefundableReasons.includes(request.reason)) {
      return {
        success: false,
        error: {
          code: 'NON_REFUNDABLE',
          message: 'This payment is not eligible for refund',
        },
      };
    }

    return { success: true, data: true };
  }

  private async getPaymentIntent(paymentIntentId: string): Promise<PaymentResult<PaymentIntent>> {
    // Try Stripe first, then Mollie
    let result = await this.stripeService.getPaymentIntent(paymentIntentId);
    if (!result.success) {
      result = await this.mollieService.getPaymentIntent(paymentIntentId);
    }
    return result;
  }

  private async logRefundActivity(refund: RefundRequest, initiatedBy: string): Promise<void> {
    console.log('Refund Activity:', {
      refundId: refund.id,
      paymentIntentId: refund.paymentIntentId,
      amount: refund.amount,
      reason: refund.reason,
      initiatedBy,
      timestamp: new Date().toISOString(),
    });
  }

  private async logDisputeActivity(dispute: DisputeCase, action: string): Promise<void> {
    console.log('Dispute Activity:', {
      disputeId: dispute.id,
      paymentIntentId: dispute.paymentIntentId,
      action,
      status: dispute.status,
      timestamp: new Date().toISOString(),
    });
  }

  private async notifyDisputeParties(dispute: DisputeCase): Promise<void> {
    // Send notifications to customer, provider, and support team
    console.log('Notifying dispute parties:', dispute.id);
  }

  private async notifyProviderChargeback(dispute: DisputeCase): Promise<void> {
    // Send urgent notification to provider about chargeback
    console.log('Notifying provider about chargeback:', dispute.id);
  }

  private async collectChargebackEvidence(paymentIntentId: string): Promise<string[]> {
    // Collect relevant evidence for chargeback defense
    return [
      'payment_confirmation',
      'service_delivery_proof',
      'communication_logs',
      'terms_of_service_acceptance',
    ];
  }
}