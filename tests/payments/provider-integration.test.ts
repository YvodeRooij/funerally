/**
 * Provider Integration Tests - Stripe and Mollie
 * Tests payment provider integrations, webhooks, and error scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StripePaymentService } from '@/lib/payments/stripe';
import { MolliePaymentService } from '@/lib/payments/mollie';
import { PaymentProvider, PaymentType, PaymentStatus } from '@/lib/payments/types';

// Mock external dependencies
vi.mock('stripe', () => ({
  Stripe: vi.fn().mockImplementation(() => ({
    paymentIntents: {
      create: vi.fn(),
      confirm: vi.fn(),
      retrieve: vi.fn(),
    },
    refunds: {
      create: vi.fn(),
    },
    paymentMethods: {
      create: vi.fn(),
      attach: vi.fn(),
    },
    customers: {
      update: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
}));

vi.mock('@mollie/api-client', () => ({
  createMollieClient: vi.fn(() => ({
    payments: {
      create: vi.fn(),
      get: vi.fn(),
    },
    paymentRefunds: {
      create: vi.fn(),
    },
    methods: {
      list: vi.fn(),
    },
    paymentLinks: {
      create: vi.fn(),
    },
  })),
  PaymentStatus: {
    open: 'open',
    pending: 'pending',
    paid: 'paid',
    failed: 'failed',
    canceled: 'canceled',
    expired: 'expired',
    authorized: 'authorized',
  },
}));

describe('Stripe Payment Service', () => {
  let stripeService: StripePaymentService;
  let mockStripe: any;

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
    stripeService = new StripePaymentService();
    mockStripe = (stripeService as any).stripe;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Payment Intent Creation', () => {
    it('should create a payment intent successfully', async () => {
      const mockIntent = {
        id: 'pi_test_123',
        amount: 10000,
        currency: 'eur',
        status: 'requires_payment_method',
        client_secret: 'pi_test_123_secret',
        created: Math.floor(Date.now() / 1000),
        metadata: {},
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockIntent);

      const request = {
        amount: { amount: 10000, currency: 'EUR' as const },
        paymentType: PaymentType.FAMILY_FEE,
        customerId: 'cust_123',
        serviceId: 'service_123',
        description: 'Test payment',
      };

      const result = await stripeService.createPaymentIntent(request);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('pi_test_123');
      expect(result.data?.provider).toBe(PaymentProvider.STRIPE);
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expect.any(Number),
          currency: 'eur',
          description: 'Test payment',
        })
      );
    });

    it('should handle marketplace splits correctly', async () => {
      const mockIntent = {
        id: 'pi_test_123',
        amount: 10000,
        currency: 'eur',
        status: 'requires_payment_method',
        created: Math.floor(Date.now() / 1000),
        metadata: {},
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockIntent);

      const request = {
        amount: { amount: 10000, currency: 'EUR' as const },
        paymentType: PaymentType.REGULAR_SERVICE,
        customerId: 'cust_123',
        providerId: 'provider_123',
        serviceId: 'service_123',
        description: 'Test marketplace payment',
      };

      const result = await stripeService.createPaymentIntent(request);

      expect(result.success).toBe(true);
      expect(result.data?.split).toBeDefined();
      expect(result.data?.split?.providerId).toBe('provider_123');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          application_fee_amount: expect.any(Number),
          transfer_data: {
            destination: 'provider_123',
          },
        })
      );
    });

    it('should apply gemeentebegrafenis reduction', async () => {
      const mockIntent = {
        id: 'pi_test_123',
        amount: 7000, // Reduced from 10000
        currency: 'eur',
        status: 'requires_payment_method',
        created: Math.floor(Date.now() / 1000),
        metadata: {},
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockIntent);

      const request = {
        amount: { amount: 10000, currency: 'EUR' as const },
        paymentType: PaymentType.GEMEENTEBEGRAFENIS,
        customerId: 'cust_123',
        serviceId: 'service_123',
        description: 'Gemeentebegrafenis payment',
      };

      const result = await stripeService.createPaymentIntent(request);

      expect(result.success).toBe(true);
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expect.any(Number), // Should be reduced amount
          metadata: expect.objectContaining({
            paymentType: PaymentType.GEMEENTEBEGRAFENIS,
          }),
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue(new Error('Card declined'));

      const request = {
        amount: { amount: 10000, currency: 'EUR' as const },
        paymentType: PaymentType.FAMILY_FEE,
        customerId: 'cust_123',
        serviceId: 'service_123',
        description: 'Test payment',
      };

      const result = await stripeService.createPaymentIntent(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STRIPE_CREATE_INTENT_ERROR');
      expect(result.error?.message).toBe('Card declined');
    });
  });

  describe('Payment Processing', () => {
    it('should confirm payment successfully', async () => {
      const mockIntent = {
        id: 'pi_test_123',
        amount: 10000,
        currency: 'eur',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
        metadata: { 
          customerId: 'cust_123',
          serviceId: 'service_123',
          paymentType: PaymentType.FAMILY_FEE,
        },
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue(mockIntent);

      const request = {
        paymentIntentId: 'pi_test_123',
        paymentMethodId: 'pm_test_123',
      };

      const result = await stripeService.processPayment(request);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(PaymentStatus.COMPLETED);
      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith(
        'pi_test_123',
        expect.objectContaining({
          payment_method: 'pm_test_123',
          return_url: expect.stringContaining('/payment/success'),
        })
      );
    });

    it('should handle 3D Secure authentication', async () => {
      const mockIntent = {
        id: 'pi_test_123',
        amount: 10000,
        currency: 'eur',
        status: 'requires_action',
        created: Math.floor(Date.now() / 1000),
        metadata: { 
          customerId: 'cust_123',
          serviceId: 'service_123',
          paymentType: PaymentType.FAMILY_FEE,
        },
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue(mockIntent);

      const request = {
        paymentIntentId: 'pi_test_123',
        paymentMethodId: 'pm_test_123',
      };

      const result = await stripeService.processPayment(request);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(PaymentStatus.PENDING);
    });
  });

  describe('Refund Processing', () => {
    it('should create full refund successfully', async () => {
      const mockRefund = {
        id: 're_test_123',
        amount: 10000,
        currency: 'eur',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
      };

      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await stripeService.createRefund('pi_test_123');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(PaymentStatus.REFUNDED);
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        reason: undefined,
      });
    });

    it('should create partial refund successfully', async () => {
      const mockRefund = {
        id: 're_test_123',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
      };

      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await stripeService.createRefund('pi_test_123', 5000, 'duplicate_charge');

      expect(result.success).toBe(true);
      expect(result.data?.amount.amount).toBe(5000);
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        amount: 5000,
        reason: 'duplicate_charge',
      });
    });
  });

  describe('Webhook Handling', () => {
    it('should handle payment succeeded webhook', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
            amount: 10000,
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = await stripeService.handleWebhook('payload', 'signature');

      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('payment_succeeded');
    });

    it('should handle payment failed webhook', async () => {
      const mockEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'failed',
            amount: 10000,
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = await stripeService.handleWebhook('payload', 'signature');

      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('payment_failed');
    });

    it('should handle dispute created webhook', async () => {
      const mockEvent = {
        type: 'charge.dispute.created',
        data: {
          object: {
            id: 'dp_test_123',
            charge: 'ch_test_123',
            amount: 10000,
            reason: 'fraudulent',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = await stripeService.handleWebhook('payload', 'signature');

      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('dispute_created');
    });

    it('should handle invalid webhook signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const result = await stripeService.handleWebhook('payload', 'invalid_signature');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STRIPE_WEBHOOK_ERROR');
    });
  });
});

describe('Mollie Payment Service', () => {
  let mollieService: MolliePaymentService;
  let mockMollie: any;

  beforeEach(() => {
    process.env.MOLLIE_API_KEY = 'test_123';
    process.env.MOLLIE_WEBHOOK_URL = '/api/webhooks/mollie';
    mollieService = new MolliePaymentService();
    mockMollie = (mollieService as any).mollie;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Payment Creation', () => {
    it('should create iDEAL payment successfully', async () => {
      const mockPayment = {
        id: 'tr_test_123',
        amount: { value: '100.00', currency: 'EUR' },
        description: 'Test payment',
        status: 'open',
        checkoutUrl: 'https://checkout.mollie.com/test',
        createdAt: new Date().toISOString(),
        metadata: {},
      };

      mockMollie.payments.create.mockResolvedValue(mockPayment);

      const request = {
        amount: { amount: 10000, currency: 'EUR' as const },
        paymentType: PaymentType.FAMILY_FEE,
        customerId: 'cust_123',
        serviceId: 'service_123',
        description: 'Test iDEAL payment',
      };

      const result = await mollieService.createPaymentIntent(request);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('tr_test_123');
      expect(result.data?.provider).toBe(PaymentProvider.MOLLIE);
      expect(mockMollie.payments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: { currency: 'EUR', value: '100.00' },
          description: 'Test iDEAL payment',
          locale: 'nl_NL',
          method: expect.arrayContaining(['ideal']),
        })
      );
    });

    it('should create gemeentebegrafenis payment with reduction', async () => {
      const mockPayment = {
        id: 'tr_test_123',
        amount: { value: '70.00', currency: 'EUR' }, // 30% reduction applied
        description: 'Gemeentebegrafenis payment',
        status: 'open',
        checkoutUrl: 'https://checkout.mollie.com/test',
        createdAt: new Date().toISOString(),
        metadata: { paymentType: PaymentType.GEMEENTEBEGRAFENIS },
      };

      mockMollie.payments.create.mockResolvedValue(mockPayment);

      const request = {
        amount: { amount: 10000, currency: 'EUR' as const },
        paymentType: PaymentType.GEMEENTEBEGRAFENIS,
        customerId: 'cust_123',
        serviceId: 'service_123',
        description: 'Gemeentebegrafenis payment',
      };

      const result = await mollieService.createPaymentIntent(request);

      expect(result.success).toBe(true);
      expect(mockMollie.payments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: { currency: 'EUR', value: '70.00' },
          metadata: expect.objectContaining({
            paymentType: PaymentType.GEMEENTEBEGRAFENIS,
          }),
        })
      );
    });
  });

  describe('Payment Processing', () => {
    it('should redirect to checkout URL', async () => {
      const mockPayment = {
        id: 'tr_test_123',
        checkoutUrl: 'https://checkout.mollie.com/test_123',
        status: 'open',
      };

      mockMollie.payments.get.mockResolvedValue(mockPayment);

      const request = {
        paymentIntentId: 'tr_test_123',
      };

      const result = await mollieService.processPayment(request);

      expect(result.success).toBe(true);
      expect(result.data?.checkoutUrl).toBe('https://checkout.mollie.com/test_123');
    });

    it('should handle missing checkout URL', async () => {
      const mockPayment = {
        id: 'tr_test_123',
        checkoutUrl: null,
        status: 'open',
      };

      mockMollie.payments.get.mockResolvedValue(mockPayment);

      const request = {
        paymentIntentId: 'tr_test_123',
      };

      const result = await mollieService.processPayment(request);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('No checkout URL available');
    });
  });

  describe('Refund Processing', () => {
    it('should create refund successfully', async () => {
      const mockRefund = {
        id: 'rf_test_123',
        amount: { value: '50.00', currency: 'EUR' },
        status: 'queued',
        createdAt: new Date().toISOString(),
      };

      mockMollie.paymentRefunds.create.mockResolvedValue(mockRefund);

      const result = await mollieService.createRefund('tr_test_123', 5000, 'Customer request');

      expect(result.success).toBe(true);
      expect(result.data?.amount.amount).toBe(5000);
      expect(mockMollie.paymentRefunds.create).toHaveBeenCalledWith(
        'tr_test_123',
        {
          amount: { currency: 'EUR', value: '50.00' },
          description: 'Customer request',
        }
      );
    });
  });

  describe('Payment Methods', () => {
    it('should get available payment methods', async () => {
      const mockMethods = [
        { id: 'ideal', description: 'iDEAL' },
        { id: 'creditcard', description: 'Credit card' },
        { id: 'bancontact', description: 'Bancontact' },
      ];

      mockMollie.methods.list.mockResolvedValue(mockMethods);

      const result = await mollieService.getPaymentMethods(10000);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['ideal', 'creditcard', 'bancontact']);
      expect(mockMollie.methods.list).toHaveBeenCalledWith({
        amount: { currency: 'EUR', value: '100.00' },
        resource: 'payments',
        locale: 'nl_NL',
      });
    });
  });

  describe('Payment Links', () => {
    it('should create payment link successfully', async () => {
      const mockPaymentLink = {
        id: 'pl_test_123',
        paymentUrl: 'https://paymentlink.mollie.com/payment/test_123',
      };

      mockMollie.paymentLinks.create.mockResolvedValue(mockPaymentLink);

      const request = {
        amount: { amount: 10000, currency: 'EUR' as const },
        paymentType: PaymentType.FAMILY_FEE,
        customerId: 'cust_123',
        serviceId: 'service_123',
        description: 'Payment link test',
      };

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const result = await mollieService.createPaymentLink(request, expiresAt);

      expect(result.success).toBe(true);
      expect(result.data?.paymentLinkUrl).toBe('https://paymentlink.mollie.com/payment/test_123');
      expect(result.data?.paymentId).toBe('pl_test_123');
    });
  });

  describe('Webhook Handling', () => {
    it('should handle payment paid webhook', async () => {
      const mockPayment = {
        id: 'tr_test_123',
        status: 'paid',
        amount: { value: '100.00', currency: 'EUR' },
      };

      mockMollie.payments.get.mockResolvedValue(mockPayment);

      const result = await mollieService.handleWebhook('tr_test_123');

      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('payment_paid');
    });

    it('should handle payment failed webhook', async () => {
      const mockPayment = {
        id: 'tr_test_123',
        status: 'failed',
        amount: { value: '100.00', currency: 'EUR' },
      };

      mockMollie.payments.get.mockResolvedValue(mockPayment);

      const result = await mollieService.handleWebhook('tr_test_123');

      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('payment_failed');
    });

    it('should handle payment expired webhook', async () => {
      const mockPayment = {
        id: 'tr_test_123',
        status: 'expired',
        amount: { value: '100.00', currency: 'EUR' },
      };

      mockMollie.payments.get.mockResolvedValue(mockPayment);

      const result = await mollieService.handleWebhook('tr_test_123');

      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('payment_expired');
    });
  });
});

describe('Provider Integration Edge Cases', () => {
  it('should handle network timeouts', async () => {
    const stripeService = new StripePaymentService();
    const mockStripe = (stripeService as any).stripe;
    
    mockStripe.paymentIntents.create.mockRejectedValue(new Error('Request timeout'));

    const request = {
      amount: { amount: 10000, currency: 'EUR' as const },
      paymentType: PaymentType.FAMILY_FEE,
      customerId: 'cust_123',
      serviceId: 'service_123',
      description: 'Test payment',
    };

    const result = await stripeService.createPaymentIntent(request);

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Request timeout');
  });

  it('should handle rate limiting', async () => {
    const mollieService = new MolliePaymentService();
    const mockMollie = (mollieService as any).mollie;
    
    const rateLimitError = new Error('Rate limit exceeded');
    (rateLimitError as any).statusCode = 429;
    mockMollie.payments.create.mockRejectedValue(rateLimitError);

    const request = {
      amount: { amount: 10000, currency: 'EUR' as const },
      paymentType: PaymentType.FAMILY_FEE,
      customerId: 'cust_123',
      serviceId: 'service_123',
      description: 'Test payment',
    };

    const result = await mollieService.createPaymentIntent(request);

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Rate limit exceeded');
  });

  it('should handle invalid API keys', async () => {
    process.env.STRIPE_SECRET_KEY = 'invalid_key';
    const stripeService = new StripePaymentService();
    const mockStripe = (stripeService as any).stripe;
    
    const authError = new Error('Invalid API key');
    (authError as any).statusCode = 401;
    mockStripe.paymentIntents.create.mockRejectedValue(authError);

    const request = {
      amount: { amount: 10000, currency: 'EUR' as const },
      paymentType: PaymentType.FAMILY_FEE,
      customerId: 'cust_123',
      serviceId: 'service_123',
      description: 'Test payment',
    };

    const result = await stripeService.createPaymentIntent(request);

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Invalid API key');
  });
});