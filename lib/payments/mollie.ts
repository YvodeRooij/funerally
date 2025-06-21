/**
 * Mollie payment integration for Dutch payment methods
 */

import { createMollieClient, Payment, PaymentStatus as MolliePaymentStatus } from '@mollie/api-client';
import {
  PaymentIntent,
  PaymentResult,
  CreatePaymentIntentRequest,
  ProcessPaymentRequest,
  RefundRequest,
  PaymentMethod,
  PaymentMethodRequest,
  PaymentProvider,
  PaymentStatus,
  PaymentType,
} from './types';
import { getPaymentConfig, calculateFees, MOLLIE_PAYMENT_METHODS } from './config';

export class MolliePaymentService {
  private mollie: ReturnType<typeof createMollieClient>;
  private config: ReturnType<typeof getPaymentConfig>;

  constructor() {
    this.config = getPaymentConfig();
    this.mollie = createMollieClient({
      apiKey: this.config.mollie.apiKey,
    });
  }

  /**
   * Create a payment intent using Mollie
   */
  async createPaymentIntent(
    request: CreatePaymentIntentRequest
  ): Promise<PaymentResult<PaymentIntent>> {
    try {
      const isGemeentebegrafenis = request.paymentType === PaymentType.GEMEENTEBEGRAFENIS;
      const fees = calculateFees(request.amount.amount, request.paymentType, isGemeentebegrafenis);

      // Convert cents to euros for Mollie
      const amountInEuros = (fees.baseAmount / 100).toFixed(2);

      const molliePayment = await this.mollie.payments.create({
        amount: {
          currency: 'EUR',
          value: amountInEuros,
        },
        description: request.description,
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        webhookUrl: this.config.mollie.webhookUrl,
        metadata: {
          customerId: request.customerId,
          providerId: request.providerId || '',
          serviceId: request.serviceId,
          paymentType: request.paymentType,
          platformFee: fees.platformFee.toString(),
          commissionFee: fees.commissionFee.toString(),
          ...request.metadata,
        },
        method: MOLLIE_PAYMENT_METHODS, // Accept all supported methods
        locale: 'nl_NL',
      });

      const paymentIntent: PaymentIntent = {
        id: molliePayment.id,
        provider: PaymentProvider.MOLLIE,
        amount: request.amount,
        paymentType: request.paymentType,
        customerId: request.customerId,
        providerId: request.providerId,
        serviceId: request.serviceId,
        description: request.description,
        metadata: request.metadata || {},
        status: this.mapMollieStatus(molliePayment.status),
        providerPaymentId: molliePayment.id,
        split: request.providerId ? {
          providerId: request.providerId,
          providerAmount: { amount: fees.netAmount, currency: 'EUR' },
          platformFee: { amount: fees.platformFee, currency: 'EUR' },
          commissionFee: { amount: fees.commissionFee, currency: 'EUR' },
          netAmount: { amount: fees.netAmount, currency: 'EUR' },
        } : undefined,
        createdAt: new Date(molliePayment.createdAt),
        updatedAt: new Date(),
      };

      return { success: true, data: paymentIntent };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MOLLIE_CREATE_PAYMENT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create Mollie payment',
          details: { error },
        },
      };
    }
  }

  /**
   * Process a payment (for Mollie this redirects to payment URL)
   */
  async processPayment(
    request: ProcessPaymentRequest
  ): Promise<PaymentResult<{ checkoutUrl: string }>> {
    try {
      const molliePayment = await this.mollie.payments.get(request.paymentIntentId);
      
      if (!molliePayment.checkoutUrl) {
        throw new Error('No checkout URL available');
      }

      return { 
        success: true, 
        data: { checkoutUrl: molliePayment.checkoutUrl } 
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MOLLIE_PROCESS_PAYMENT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process Mollie payment',
          details: { error },
        },
      };
    }
  }

  /**
   * Create a refund for a Mollie payment
   */
  async createRefund(
    paymentId: string,
    amount?: number,
    description?: string
  ): Promise<PaymentResult<RefundRequest>> {
    try {
      const refundParams: any = {
        description: description || 'Refund requested',
      };

      if (amount) {
        refundParams.amount = {
          currency: 'EUR',
          value: (amount / 100).toFixed(2), // Convert cents to euros
        };
      }

      const mollieRefund = await this.mollie.paymentRefunds.create(paymentId, refundParams);

      const refundRequest: RefundRequest = {
        id: mollieRefund.id,
        paymentIntentId: paymentId,
        amount: { 
          amount: Math.round(parseFloat(mollieRefund.amount.value) * 100), 
          currency: 'EUR' 
        },
        reason: description || 'requested_by_customer',
        status: this.mapMollieRefundStatus(mollieRefund.status),
        refundId: mollieRefund.id,
        createdAt: new Date(mollieRefund.createdAt),
      };

      return { success: true, data: refundRequest };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MOLLIE_REFUND_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create Mollie refund',
          details: { error },
        },
      };
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentIntent(paymentId: string): Promise<PaymentResult<PaymentIntent>> {
    try {
      const molliePayment = await this.mollie.payments.get(paymentId);

      const paymentIntent: PaymentIntent = {
        id: molliePayment.id,
        provider: PaymentProvider.MOLLIE,
        amount: { 
          amount: Math.round(parseFloat(molliePayment.amount.value) * 100), 
          currency: 'EUR' 
        },
        paymentType: molliePayment.metadata?.paymentType as PaymentType || PaymentType.REGULAR_SERVICE,
        customerId: molliePayment.metadata?.customerId || '',
        providerId: molliePayment.metadata?.providerId || undefined,
        serviceId: molliePayment.metadata?.serviceId || '',
        description: molliePayment.description || '',
        metadata: molliePayment.metadata || {},
        status: this.mapMollieStatus(molliePayment.status),
        providerPaymentId: molliePayment.id,
        createdAt: new Date(molliePayment.createdAt),
        updatedAt: new Date(),
      };

      return { success: true, data: paymentIntent };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MOLLIE_GET_PAYMENT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get Mollie payment',
          details: { error },
        },
      };
    }
  }

  /**
   * Handle Mollie webhooks
   */
  async handleWebhook(paymentId: string): Promise<PaymentResult<any>> {
    try {
      const molliePayment = await this.mollie.payments.get(paymentId);

      switch (molliePayment.status) {
        case MolliePaymentStatus.paid:
          return this.handlePaymentPaid(molliePayment);
        case MolliePaymentStatus.failed:
          return this.handlePaymentFailed(molliePayment);
        case MolliePaymentStatus.canceled:
          return this.handlePaymentCanceled(molliePayment);
        case MolliePaymentStatus.expired:
          return this.handlePaymentExpired(molliePayment);
        default:
          return { success: true, data: { processed: false, status: molliePayment.status } };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MOLLIE_WEBHOOK_ERROR',
          message: error instanceof Error ? error.message : 'Failed to handle Mollie webhook',
          details: { error },
        },
      };
    }
  }

  /**
   * Get available payment methods for a customer
   */
  async getPaymentMethods(
    amount: number,
    countryCode = 'NL'
  ): Promise<PaymentResult<string[]>> {
    try {
      const methods = await this.mollie.methods.list({
        amount: {
          currency: 'EUR',
          value: (amount / 100).toFixed(2),
        },
        resource: 'payments',
        locale: 'nl_NL',
      });

      const availableMethods = methods.map(method => method.id);
      
      return { success: true, data: availableMethods };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MOLLIE_GET_METHODS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get payment methods',
          details: { error },
        },
      };
    }
  }

  /**
   * Create a payment link for email/SMS sharing
   */
  async createPaymentLink(
    request: CreatePaymentIntentRequest,
    expiresAt?: Date
  ): Promise<PaymentResult<{ paymentLinkUrl: string; paymentId: string }>> {
    try {
      const isGemeentebegrafenis = request.paymentType === PaymentType.GEMEENTEBEGRAFENIS;
      const fees = calculateFees(request.amount.amount, request.paymentType, isGemeentebegrafenis);
      const amountInEuros = (fees.baseAmount / 100).toFixed(2);

      const paymentLink = await this.mollie.paymentLinks.create({
        amount: {
          currency: 'EUR',
          value: amountInEuros,
        },
        description: request.description,
        expiresAt: expiresAt?.toISOString(),
        metadata: {
          customerId: request.customerId,
          providerId: request.providerId || '',
          serviceId: request.serviceId,
          paymentType: request.paymentType,
          ...request.metadata,
        },
      });

      return {
        success: true,
        data: {
          paymentLinkUrl: paymentLink.paymentUrl,
          paymentId: paymentLink.id,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MOLLIE_CREATE_LINK_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create payment link',
          details: { error },
        },
      };
    }
  }

  private async handlePaymentPaid(payment: Payment) {
    // Update payment status in database
    // Process marketplace splits
    // Send confirmation notifications
    return { success: true, data: { type: 'payment_paid', payment } };
  }

  private async handlePaymentFailed(payment: Payment) {
    // Update payment status
    // Send failure notifications
    return { success: true, data: { type: 'payment_failed', payment } };
  }

  private async handlePaymentCanceled(payment: Payment) {
    // Update payment status
    // Handle cancellation logic
    return { success: true, data: { type: 'payment_canceled', payment } };
  }

  private async handlePaymentExpired(payment: Payment) {
    // Update payment status
    // Handle expiration logic
    return { success: true, data: { type: 'payment_expired', payment } };
  }

  private mapMollieStatus(status: MolliePaymentStatus): PaymentStatus {
    switch (status) {
      case MolliePaymentStatus.open:
      case MolliePaymentStatus.pending:
        return PaymentStatus.PENDING;
      case MolliePaymentStatus.authorized:
        return PaymentStatus.PROCESSING;
      case MolliePaymentStatus.paid:
        return PaymentStatus.COMPLETED;
      case MolliePaymentStatus.canceled:
        return PaymentStatus.CANCELLED;
      case MolliePaymentStatus.failed:
      case MolliePaymentStatus.expired:
      default:
        return PaymentStatus.FAILED;
    }
  }

  private mapMollieRefundStatus(status: string): PaymentStatus {
    switch (status) {
      case 'queued':
      case 'pending':
        return PaymentStatus.PROCESSING;
      case 'processing':
        return PaymentStatus.PROCESSING;
      case 'refunded':
        return PaymentStatus.REFUNDED;
      case 'failed':
      default:
        return PaymentStatus.FAILED;
    }
  }
}