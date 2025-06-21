/**
 * Stripe payment integration for Farewelly marketplace
 */

import { Stripe } from 'stripe';
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
import { getPaymentConfig, calculateFees } from './config';

export class StripePaymentService {
  private stripe: Stripe;
  private config: ReturnType<typeof getPaymentConfig>;

  constructor() {
    this.config = getPaymentConfig();
    this.stripe = new Stripe(this.config.stripe.secretKey, {
      apiVersion: '2024-06-20',
      appInfo: {
        name: 'Farewelly',
        version: '1.0.0',
      },
    });
  }

  /**
   * Create a payment intent for marketplace transactions
   */
  async createPaymentIntent(
    request: CreatePaymentIntentRequest
  ): Promise<PaymentResult<PaymentIntent>> {
    try {
      const isGemeentebegrafenis = request.paymentType === PaymentType.GEMEENTEBEGRAFENIS;
      const fees = calculateFees(request.amount.amount, request.paymentType, isGemeentebegrafenis);

      // Create Stripe payment intent with application fee for marketplace
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: fees.baseAmount,
        currency: 'eur',
        automatic_payment_methods: {
          enabled: true,
        },
        description: request.description,
        metadata: {
          ...request.metadata,
          customerId: request.customerId,
          providerId: request.providerId || '',
          serviceId: request.serviceId,
          paymentType: request.paymentType,
          platformFee: fees.platformFee.toString(),
          commissionFee: fees.commissionFee.toString(),
        },
      };

      // Add application fee for marketplace model
      if (request.providerId) {
        paymentIntentParams.application_fee_amount = fees.platformFee + fees.commissionFee;
        paymentIntentParams.transfer_data = {
          destination: request.providerId, // Stripe Connect account ID
        };
      }

      const stripeIntent = await this.stripe.paymentIntents.create(paymentIntentParams);

      const paymentIntent: PaymentIntent = {
        id: stripeIntent.id,
        provider: PaymentProvider.STRIPE,
        amount: request.amount,
        paymentType: request.paymentType,
        customerId: request.customerId,
        providerId: request.providerId,
        serviceId: request.serviceId,
        description: request.description,
        metadata: request.metadata || {},
        status: this.mapStripeStatus(stripeIntent.status),
        clientSecret: stripeIntent.client_secret || undefined,
        providerPaymentId: stripeIntent.id,
        split: request.providerId ? {
          providerId: request.providerId,
          providerAmount: { amount: fees.netAmount, currency: 'EUR' },
          platformFee: { amount: fees.platformFee, currency: 'EUR' },
          commissionFee: { amount: fees.commissionFee, currency: 'EUR' },
          netAmount: { amount: fees.netAmount, currency: 'EUR' },
        } : undefined,
        createdAt: new Date(stripeIntent.created * 1000),
        updatedAt: new Date(),
      };

      return { success: true, data: paymentIntent };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STRIPE_CREATE_INTENT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create payment intent',
          details: { error },
        },
      };
    }
  }

  /**
   * Process a payment intent
   */
  async processPayment(
    request: ProcessPaymentRequest
  ): Promise<PaymentResult<PaymentIntent>> {
    try {
      const stripeIntent = await this.stripe.paymentIntents.confirm(
        request.paymentIntentId,
        {
          payment_method: request.paymentMethodId,
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        }
      );

      const paymentIntent: PaymentIntent = {
        id: stripeIntent.id,
        provider: PaymentProvider.STRIPE,
        amount: { amount: stripeIntent.amount, currency: 'EUR' },
        paymentType: stripeIntent.metadata.paymentType as PaymentType,
        customerId: stripeIntent.metadata.customerId,
        providerId: stripeIntent.metadata.providerId || undefined,
        serviceId: stripeIntent.metadata.serviceId,
        description: stripeIntent.description || '',
        metadata: stripeIntent.metadata,
        status: this.mapStripeStatus(stripeIntent.status),
        clientSecret: stripeIntent.client_secret || undefined,
        providerPaymentId: stripeIntent.id,
        createdAt: new Date(stripeIntent.created * 1000),
        updatedAt: new Date(),
      };

      return { success: true, data: paymentIntent };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STRIPE_PROCESS_PAYMENT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process payment',
          details: { error },
        },
      };
    }
  }

  /**
   * Create a refund for a payment
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<PaymentResult<RefundRequest>> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason: reason as Stripe.RefundCreateParams.Reason,
      };

      if (amount) {
        refundParams.amount = amount;
      }

      const stripeRefund = await this.stripe.refunds.create(refundParams);

      const refundRequest: RefundRequest = {
        id: stripeRefund.id,
        paymentIntentId,
        amount: { amount: stripeRefund.amount, currency: 'EUR' },
        reason: reason || 'requested_by_customer',
        status: this.mapStripeRefundStatus(stripeRefund.status),
        refundId: stripeRefund.id,
        createdAt: new Date(stripeRefund.created * 1000),
      };

      return { success: true, data: refundRequest };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STRIPE_REFUND_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create refund',
          details: { error },
        },
      };
    }
  }

  /**
   * Create a payment method for a customer
   */
  async createPaymentMethod(
    request: PaymentMethodRequest
  ): Promise<PaymentResult<PaymentMethod>> {
    try {
      const stripePaymentMethod = await this.stripe.paymentMethods.create({
        type: request.type as Stripe.PaymentMethodCreateParams.Type,
        ...request.details,
      });

      // Attach to customer
      await this.stripe.paymentMethods.attach(stripePaymentMethod.id, {
        customer: request.customerId,
      });

      // Set as default if requested
      if (request.setAsDefault) {
        await this.stripe.customers.update(request.customerId, {
          invoice_settings: {
            default_payment_method: stripePaymentMethod.id,
          },
        });
      }

      const paymentMethod: PaymentMethod = {
        id: stripePaymentMethod.id,
        type: stripePaymentMethod.type,
        provider: PaymentProvider.STRIPE,
        customerId: request.customerId,
        isDefault: request.setAsDefault || false,
        details: stripePaymentMethod,
        createdAt: new Date(stripePaymentMethod.created * 1000),
      };

      return { success: true, data: paymentMethod };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STRIPE_PAYMENT_METHOD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create payment method',
          details: { error },
        },
      };
    }
  }

  /**
   * Get payment intent by ID
   */
  async getPaymentIntent(paymentIntentId: string): Promise<PaymentResult<PaymentIntent>> {
    try {
      const stripeIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      const paymentIntent: PaymentIntent = {
        id: stripeIntent.id,
        provider: PaymentProvider.STRIPE,
        amount: { amount: stripeIntent.amount, currency: 'EUR' },
        paymentType: stripeIntent.metadata.paymentType as PaymentType,
        customerId: stripeIntent.metadata.customerId,
        providerId: stripeIntent.metadata.providerId || undefined,
        serviceId: stripeIntent.metadata.serviceId,
        description: stripeIntent.description || '',
        metadata: stripeIntent.metadata,
        status: this.mapStripeStatus(stripeIntent.status),
        clientSecret: stripeIntent.client_secret || undefined,
        providerPaymentId: stripeIntent.id,
        createdAt: new Date(stripeIntent.created * 1000),
        updatedAt: new Date(),
      };

      return { success: true, data: paymentIntent };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STRIPE_GET_INTENT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get payment intent',
          details: { error },
        },
      };
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(
    payload: string,
    signature: string
  ): Promise<PaymentResult<any>> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.config.stripe.webhookSecret
      );

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          return this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        case 'payment_intent.payment_failed':
          return this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        case 'charge.dispute.created':
          return this.handleDisputeCreated(event.data.object as Stripe.Dispute);
        default:
          return { success: true, data: { processed: false, type: event.type } };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STRIPE_WEBHOOK_ERROR',
          message: error instanceof Error ? error.message : 'Failed to handle webhook',
          details: { error },
        },
      };
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    // Update payment status in database
    // Trigger fulfillment processes
    // Send confirmation emails
    return { success: true, data: { type: 'payment_succeeded', paymentIntent } };
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    // Update payment status in database
    // Send failure notifications
    return { success: true, data: { type: 'payment_failed', paymentIntent } };
  }

  private async handleDisputeCreated(dispute: Stripe.Dispute) {
    // Create dispute record in database
    // Notify relevant parties
    return { success: true, data: { type: 'dispute_created', dispute } };
  }

  private mapStripeStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
    switch (status) {
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return PaymentStatus.PENDING;
      case 'processing':
        return PaymentStatus.PROCESSING;
      case 'succeeded':
        return PaymentStatus.COMPLETED;
      case 'canceled':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.FAILED;
    }
  }

  private mapStripeRefundStatus(status: Stripe.Refund.Status): PaymentStatus {
    switch (status) {
      case 'succeeded':
        return PaymentStatus.REFUNDED;
      case 'pending':
        return PaymentStatus.PROCESSING;
      case 'failed':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.FAILED;
    }
  }
}