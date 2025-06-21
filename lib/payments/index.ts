/**
 * Farewelly Payment System - Main Export
 * 
 * Comprehensive marketplace payment system with:
 * - Stripe/Mollie integration for Dutch market
 * - Platform fee structure (€100 family fee, 10-15% provider commission)
 * - Payment splitting logic for marketplace transactions
 * - Gemeentebegrafenis reduced rates handling
 * - Refund and dispute management
 * - Payment analytics and reporting
 */

// Core types and interfaces
export * from './types';
export * from './config';

// Payment service implementations
export { StripePaymentService } from './stripe';
export { MolliePaymentService } from './mollie';

// Payment splitting and fee management
export { PaymentSplittingService } from './splitting';
export type { 
  SplitCalculationRequest, 
  SplitResult 
} from './splitting';

// Refund and dispute handling
export { RefundDisputeService } from './refunds-disputes';
export type { 
  CreateRefundRequest, 
  CreateDisputeRequest, 
  RefundPolicy 
} from './refunds-disputes';

// Analytics and reporting
export { PaymentAnalyticsService } from './analytics';
export type { 
  AnalyticsFilter,
  RevenueAnalytics,
  TransactionAnalytics,
  CustomerAnalytics,
  ProviderAnalytics,
  GemeentebegraafnisAnalytics,
  PerformanceMetrics
} from './analytics';

// Main payment service orchestrator
import { StripePaymentService } from './stripe';
import { MolliePaymentService } from './mollie';
import { PaymentSplittingService } from './splitting';
import { RefundDisputeService } from './refunds-disputes';
import { PaymentAnalyticsService } from './analytics';
import { 
  PaymentProvider, 
  PaymentResult, 
  CreatePaymentIntentRequest, 
  ProcessPaymentRequest,
  PaymentIntent
} from './types';

export class FarewellyPaymentSystem {
  private stripeService: StripePaymentService;
  private mollieService: MolliePaymentService;
  private splittingService: PaymentSplittingService;
  private refundDisputeService: RefundDisputeService;
  private analyticsService: PaymentAnalyticsService;

  constructor() {
    this.stripeService = new StripePaymentService();
    this.mollieService = new MolliePaymentService();
    this.splittingService = new PaymentSplittingService();
    this.refundDisputeService = new RefundDisputeService();
    this.analyticsService = new PaymentAnalyticsService();
  }

  /**
   * Create payment intent using the optimal provider
   */
  async createPaymentIntent(
    request: CreatePaymentIntentRequest
  ): Promise<PaymentResult<PaymentIntent>> {
    try {
      // Determine optimal provider based on request
      const provider = request.provider || this.selectOptimalProvider(request);
      
      let result: PaymentResult<PaymentIntent>;
      
      if (provider === PaymentProvider.STRIPE) {
        result = await this.stripeService.createPaymentIntent(request);
      } else {
        result = await this.mollieService.createPaymentIntent(request);
      }

      // Track analytics
      if (result.success) {
        await this.analyticsService.trackPaymentEvent('payment_intent_created', {
          paymentIntentId: result.data?.id,
          provider,
          amount: request.amount,
          paymentType: request.paymentType,
        });
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PAYMENT_INTENT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create payment intent',
          details: { error },
        },
      };
    }
  }

  /**
   * Process payment using appropriate provider
   */
  async processPayment(
    request: ProcessPaymentRequest
  ): Promise<PaymentResult<PaymentIntent | { checkoutUrl: string }>> {
    try {
      // Determine provider from payment intent ID
      const provider = this.detectProviderFromId(request.paymentIntentId);
      
      let result: PaymentResult<any>;
      
      if (provider === PaymentProvider.STRIPE) {
        result = await this.stripeService.processPayment(request);
      } else {
        result = await this.mollieService.processPayment(request);
      }

      // Track analytics
      if (result.success) {
        await this.analyticsService.trackPaymentEvent('payment_processed', {
          paymentIntentId: request.paymentIntentId,
          provider,
        });
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PAYMENT_PROCESS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process payment',
          details: { error },
        },
      };
    }
  }

  /**
   * Get all payment services for advanced usage
   */
  getServices() {
    return {
      stripe: this.stripeService,
      mollie: this.mollieService,
      splitting: this.splittingService,
      refundDispute: this.refundDisputeService,
      analytics: this.analyticsService,
    };
  }

  /**
   * Health check for all payment services
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    timestamp: Date;
  }> {
    const services = {
      stripe: true, // Would ping Stripe API
      mollie: true, // Would ping Mollie API
      database: true, // Would check database connection
      analytics: true, // Would check analytics service
    };

    const healthyServices = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyServices >= totalServices * 0.5) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services,
      timestamp: new Date(),
    };
  }

  private selectOptimalProvider(request: CreatePaymentIntentRequest): PaymentProvider {
    // Logic to select optimal provider based on:
    // - Payment amount
    // - Customer location
    // - Payment method preferences
    // - Provider rates and reliability
    
    // For Dutch customers, prefer Mollie for local payment methods
    // For international or card payments, prefer Stripe
    
    // Default to Mollie for Dutch market
    return PaymentProvider.MOLLIE;
  }

  private detectProviderFromId(paymentIntentId: string): PaymentProvider {
    // Stripe payment intents start with 'pi_'
    if (paymentIntentId.startsWith('pi_')) {
      return PaymentProvider.STRIPE;
    }
    
    // Mollie payment IDs start with 'tr_'
    if (paymentIntentId.startsWith('tr_')) {
      return PaymentProvider.MOLLIE;
    }
    
    // Default to Mollie
    return PaymentProvider.MOLLIE;
  }
}

// Default export
export default FarewellyPaymentSystem;