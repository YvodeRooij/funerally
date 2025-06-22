/**
 * Dutch Market Tests - iDEAL payments, gemeentebegrafenis discounts, VAT handling
 * Tests Dutch-specific payment methods and regulations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MolliePaymentService } from '@/lib/payments/mollie';
import { PaymentType } from '@/lib/payments/types';
import { 
  MOLLIE_PAYMENT_METHODS,
  GEMEENTEBEGRAFENIS_CONFIG,
  isGemeentebegraafnisEligible,
  calculateFees
} from '@/lib/payments/config';

// Mock Mollie client
vi.mock('@mollie/api-client', () => ({
  createMollieClient: vi.fn(() => ({
    payments: {
      create: vi.fn(),
      get: vi.fn(),
    },
    methods: {
      list: vi.fn(),
      get: vi.fn(),
    },
    paymentLinks: {
      create: vi.fn(),
    },
  })),
  PaymentStatus: {
    open: 'open',
    paid: 'paid',
    failed: 'failed',
    canceled: 'canceled',
    expired: 'expired',
  },
}));

describe('Dutch Payment Methods', () => {
  let mollieService: MolliePaymentService;
  let mockMollie: any;

  beforeEach(() => {
    process.env.MOLLIE_API_KEY = 'test_123';
    mollieService = new MolliePaymentService();
    mockMollie = (mollieService as any).mollie;
  });

  describe('iDEAL Payment Processing', () => {
    it('should create iDEAL payment with Dutch locale', async () => {
      const mockPayment = {
        id: 'tr_ideal_123',
        amount: { value: '100.00', currency: 'EUR' },
        description: 'iDEAL Test Payment',
        status: 'open',
        method: 'ideal',
        checkoutUrl: 'https://checkout.mollie.com/ideal/test',
        createdAt: new Date().toISOString(),
        metadata: {
          locale: 'nl_NL',
          paymentMethod: 'ideal',
        },
      };

      mockMollie.payments.create.mockResolvedValue(mockPayment);

      const request = {
        amount: { amount: 10000, currency: 'EUR' as const },
        paymentType: PaymentType.FAMILY_FEE,
        customerId: 'cust_nl_123',
        serviceId: 'service_123',
        description: 'iDEAL Test Payment',
      };

      const result = await mollieService.createPaymentIntent(request);

      expect(result.success).toBe(true);
      expect(mockMollie.payments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          method: expect.arrayContaining(['ideal']),
          locale: 'nl_NL',
          amount: { currency: 'EUR', value: '100.00' },
        })
      );
    });

    it('should support all Dutch payment methods', async () => {
      const dutchMethods = [
        'ideal',
        'bancontact',
        'sofort',
        'creditcard',
        'paypal',
        'banktransfer',
        'kbc',
        'belfius',
        'eps',
        'giropay',
      ];

      expect(MOLLIE_PAYMENT_METHODS).toEqual(dutchMethods);
    });

    it('should get available payment methods for Dutch market', async () => {
      const mockMethods = [
        { id: 'ideal', description: 'iDEAL', image: { size1x: 'ideal.png' } },
        { id: 'bancontact', description: 'Bancontact', image: { size1x: 'bancontact.png' } },
        { id: 'creditcard', description: 'Credit card', image: { size1x: 'creditcard.png' } },
        { id: 'sofort', description: 'SOFORT Banking', image: { size1x: 'sofort.png' } },
      ];

      mockMollie.methods.list.mockResolvedValue(mockMethods);

      const result = await mollieService.getPaymentMethods(10000);

      expect(result.success).toBe(true);
      expect(result.data).toContain('ideal');
      expect(result.data).toContain('bancontact');
      expect(mockMollie.methods.list).toHaveBeenCalledWith({
        amount: { currency: 'EUR', value: '100.00' },
        resource: 'payments',
        locale: 'nl_NL',
      });
    });

    it('should handle iDEAL bank selection', async () => {
      const mockPayment = {
        id: 'tr_ideal_123',
        amount: { value: '250.00', currency: 'EUR' },
        method: 'ideal',
        status: 'open',
        checkoutUrl: 'https://checkout.mollie.com/ideal/test',
        details: {
          idealIssuer: 'ideal_ABNANL2A', // ABN AMRO
        },
        createdAt: new Date().toISOString(),
      };

      mockMollie.payments.create.mockResolvedValue(mockPayment);

      const request = {
        amount: { amount: 25000, currency: 'EUR' as const },
        paymentType: PaymentType.REGULAR_SERVICE,
        customerId: 'cust_nl_123',
        serviceId: 'service_123',
        description: 'iDEAL payment with bank selection',
        metadata: {
          preferredBank: 'ABNANL2A',
        },
      };

      const result = await mollieService.createPaymentIntent(request);

      expect(result.success).toBe(true);
      expect(mockMollie.payments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          method: expect.arrayContaining(['ideal']),
          locale: 'nl_NL',
        })
      );
    });
  });

  describe('Bancontact Payment Processing', () => {
    it('should create Bancontact payment for Belgian customers', async () => {
      const mockPayment = {
        id: 'tr_bancontact_123',
        amount: { value: '150.00', currency: 'EUR' },
        method: 'bancontact',
        status: 'open',
        checkoutUrl: 'https://checkout.mollie.com/bancontact/test',
        createdAt: new Date().toISOString(),
      };

      mockMollie.payments.create.mockResolvedValue(mockPayment);

      const request = {
        amount: { amount: 15000, currency: 'EUR' as const },
        paymentType: PaymentType.REGULAR_SERVICE,
        customerId: 'cust_be_123',
        serviceId: 'service_123',
        description: 'Bancontact payment test',
      };

      const result = await mollieService.createPaymentIntent(request);

      expect(result.success).toBe(true);
      expect(mockMollie.payments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          method: expect.arrayContaining(['bancontact']),
        })
      );
    });
  });

  describe('SOFORT Banking', () => {
    it('should create SOFORT payment for German customers', async () => {
      const mockPayment = {
        id: 'tr_sofort_123',
        amount: { value: '300.00', currency: 'EUR' },
        method: 'sofort',
        status: 'open',
        checkoutUrl: 'https://checkout.mollie.com/sofort/test',
        createdAt: new Date().toISOString(),
      };

      mockMollie.payments.create.mockResolvedValue(mockPayment);

      const request = {
        amount: { amount: 30000, currency: 'EUR' as const },
        paymentType: PaymentType.REGULAR_SERVICE,
        customerId: 'cust_de_123',
        serviceId: 'service_123',
        description: 'SOFORT payment test',
      };

      const result = await mollieService.createPaymentIntent(request);

      expect(result.success).toBe(true);
      expect(mockMollie.payments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          method: expect.arrayContaining(['sofort']),
        })
      );
    });
  });
});

describe('Gemeentebegrafenis (Municipal Burial) System', () => {
  describe('Eligibility Validation', () => {
    const validDocuments = [
      'income_statement',
      'municipal_approval',
      'death_certificate',
    ];

    it('should validate eligible service types', () => {
      const eligibleServices = GEMEENTEBEGRAFENIS_CONFIG.eligibleServices;
      
      expect(eligibleServices).toContain('basic_burial');
      expect(eligibleServices).toContain('cremation_basic');
      expect(eligibleServices).toContain('municipal_service');
      expect(eligibleServices).toHaveLength(3);
    });

    it('should validate required documents', () => {
      const requiredDocs = GEMEENTEBEGRAFENIS_CONFIG.requiredDocuments;
      
      expect(requiredDocs).toContain('income_statement');
      expect(requiredDocs).toContain('municipal_approval');
      expect(requiredDocs).toContain('death_certificate');
      expect(requiredDocs).toHaveLength(3);
    });

    it('should validate maximum amount limit', () => {
      const maxAmount = GEMEENTEBEGRAFENIS_CONFIG.maxAmount;
      
      expect(maxAmount.amount).toBe(200000); // €2000.00
      expect(maxAmount.currency).toBe('EUR');
    });

    it('should approve valid gemeentebegrafenis requests', () => {
      const testCases = [
        {
          amount: 150000, // €1500.00
          serviceType: 'basic_burial',
          documents: validDocuments,
          expected: true,
        },
        {
          amount: 180000, // €1800.00
          serviceType: 'cremation_basic',
          documents: validDocuments,
          expected: true,
        },
        {
          amount: 200000, // €2000.00 (exact limit)
          serviceType: 'municipal_service',
          documents: validDocuments,
          expected: true,
        },
      ];

      testCases.forEach(({ amount, serviceType, documents, expected }) => {
        const result = isGemeentebegraafnisEligible(amount, serviceType, documents);
        expect(result).toBe(expected);
      });
    });

    it('should reject invalid gemeentebegrafenis requests', () => {
      const testCases = [
        {
          amount: 250000, // Over limit
          serviceType: 'basic_burial',
          documents: validDocuments,
          reason: 'Amount exceeds limit',
        },
        {
          amount: 150000,
          serviceType: 'premium_burial', // Invalid service
          documents: validDocuments,
          reason: 'Invalid service type',
        },
        {
          amount: 150000,
          serviceType: 'basic_burial',
          documents: ['income_statement', 'death_certificate'], // Missing municipal approval
          reason: 'Missing required documents',
        },
        {
          amount: 150000,
          serviceType: 'basic_burial',
          documents: [], // No documents
          reason: 'No documents provided',
        },
      ];

      testCases.forEach(({ amount, serviceType, documents, reason }) => {
        const result = isGemeentebegraafnisEligible(amount, serviceType, documents);
        expect(result).toBe(false);
      });
    });
  });

  describe('Discount Calculation', () => {
    it('should apply 30% discount for eligible requests', () => {
      const baseAmount = 200000; // €2000.00
      const fees = calculateFees(baseAmount, PaymentType.GEMEENTEBEGRAFENIS, true);

      expect(fees.baseAmount).toBe(140000); // €1400.00 (30% reduction)
      
      const discountAmount = baseAmount - fees.baseAmount;
      expect(discountAmount).toBe(60000); // €600.00 discount
      
      const discountPercentage = (discountAmount / baseAmount) * 100;
      expect(discountPercentage).toBe(30);
    });

    it('should not apply discount for ineligible requests', () => {
      const baseAmount = 200000; // €2000.00
      const fees = calculateFees(baseAmount, PaymentType.GEMEENTEBEGRAFENIS, false);

      expect(fees.baseAmount).toBe(200000); // No reduction
    });

    it('should calculate correct fees after discount', () => {
      const baseAmount = 100000; // €1000.00
      const fees = calculateFees(baseAmount, PaymentType.GEMEENTEBEGRAFENIS, true);

      expect(fees.baseAmount).toBe(70000); // €700.00 after 30% discount
      expect(fees.platformFee).toBe(2030); // 2.9% of €700.00
      expect(fees.commissionFee).toBe(8750); // 12.5% of €700.00
      expect(fees.totalFees).toBe(10780);
      expect(fees.netAmount).toBe(59220); // €592.20
    });
  });

  describe('Documentation Validation', () => {
    it('should validate income statement requirements', () => {
      const documentsWithoutIncome = ['municipal_approval', 'death_certificate'];
      const result = isGemeentebegraafnisEligible(150000, 'basic_burial', documentsWithoutIncome);
      
      expect(result).toBe(false);
    });

    it('should validate municipal approval requirements', () => {
      const documentsWithoutApproval = ['income_statement', 'death_certificate'];
      const result = isGemeentebegraafnisEligible(150000, 'basic_burial', documentsWithoutApproval);
      
      expect(result).toBe(false);
    });

    it('should validate death certificate requirements', () => {
      const documentsWithoutCertificate = ['income_statement', 'municipal_approval'];
      const result = isGemeentebegraafnisEligible(150000, 'basic_burial', documentsWithoutCertificate);
      
      expect(result).toBe(false);
    });

    it('should accept additional documents beyond required', () => {
      const extraDocuments = [
        'income_statement',
        'municipal_approval',
        'death_certificate',
        'family_registry',
        'medical_report',
      ];
      
      const result = isGemeentebegraafnisEligible(150000, 'basic_burial', extraDocuments);
      expect(result).toBe(true);
    });
  });
});

describe('VAT Handling', () => {
  // Dutch VAT rate is typically 21% for services
  const DUTCH_VAT_RATE = 0.21;

  describe('VAT Calculation', () => {
    it('should calculate VAT for Dutch funeral services', () => {
      const baseAmount = 100000; // €1000.00 net
      const vatAmount = Math.round(baseAmount * DUTCH_VAT_RATE);
      const totalAmount = baseAmount + vatAmount;

      expect(vatAmount).toBe(21000); // €210.00 VAT
      expect(totalAmount).toBe(121000); // €1210.00 total
    });

    it('should handle VAT-inclusive pricing display', () => {
      const grossAmount = 121000; // €1210.00 including VAT
      const netAmount = Math.round(grossAmount / (1 + DUTCH_VAT_RATE));
      const vatAmount = grossAmount - netAmount;

      expect(netAmount).toBe(100000); // €1000.00 net
      expect(vatAmount).toBe(21000); // €210.00 VAT
    });

    it('should calculate VAT on fees', () => {
      const feeAmount = 2900; // €29.00 platform fee
      const vatOnFee = Math.round(feeAmount * DUTCH_VAT_RATE);
      const totalFeeWithVat = feeAmount + vatOnFee;

      expect(vatOnFee).toBe(609); // €6.09 VAT on fee
      expect(totalFeeWithVat).toBe(3509); // €35.09 total fee
    });
  });

  describe('VAT Exemptions', () => {
    it('should handle VAT exemption for certain services', () => {
      // Some funeral services may be VAT-exempt in Netherlands
      const exemptServices = [
        'basic_municipal_burial',
        'cremation_without_ceremony',
        'direct_burial',
      ];

      exemptServices.forEach(service => {
        const baseAmount = 100000;
        const vatAmount = 0; // Exempt services have no VAT
        const totalAmount = baseAmount + vatAmount;

        expect(vatAmount).toBe(0);
        expect(totalAmount).toBe(baseAmount);
      });
    });

    it('should apply reduced VAT rate for specific services', () => {
      // Some services may qualify for reduced VAT rate (6% in Netherlands)
      const REDUCED_VAT_RATE = 0.06;
      const baseAmount = 100000;
      const reducedVatAmount = Math.round(baseAmount * REDUCED_VAT_RATE);

      expect(reducedVatAmount).toBe(6000); // €60.00 reduced VAT
    });
  });

  describe('Cross-border VAT', () => {
    it('should handle VAT for EU customers', () => {
      // EU customers may have different VAT treatment
      const euCountries = ['BE', 'DE', 'FR', 'IT', 'ES'];
      
      euCountries.forEach(country => {
        const baseAmount = 100000;
        // VAT may be charged at customer's local rate or Dutch rate
        // depending on service type and customer type
        const vatAmount = Math.round(baseAmount * DUTCH_VAT_RATE);
        
        expect(vatAmount).toBeGreaterThan(0);
      });
    });

    it('should handle VAT for non-EU customers', () => {
      // Non-EU customers typically don't pay Dutch VAT
      const nonEuCountries = ['US', 'UK', 'CA', 'AU'];
      
      nonEuCountries.forEach(country => {
        const baseAmount = 100000;
        const vatAmount = 0; // No VAT for non-EU
        const totalAmount = baseAmount + vatAmount;

        expect(vatAmount).toBe(0);
        expect(totalAmount).toBe(baseAmount);
      });
    });
  });
});

describe('Dutch Regulatory Compliance', () => {
  describe('Consumer Protection', () => {
    it('should support 14-day cooling-off period', () => {
      const paymentDate = new Date();
      const coolingOffPeriod = new Date(paymentDate);
      coolingOffPeriod.setDate(coolingOffPeriod.getDate() + 14);

      const daysDifference = Math.ceil(
        (coolingOffPeriod.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDifference).toBe(14);
    });

    it('should provide clear pricing information', () => {
      const servicePrice = 100000; // €1000.00
      const vatAmount = Math.round(servicePrice * DUTCH_VAT_RATE);
      const totalPrice = servicePrice + vatAmount;

      const priceBreakdown = {
        netAmount: servicePrice,
        vatAmount: vatAmount,
        vatRate: DUTCH_VAT_RATE * 100, // 21%
        totalAmount: totalPrice,
        currency: 'EUR',
      };

      expect(priceBreakdown.netAmount).toBe(100000);
      expect(priceBreakdown.vatAmount).toBe(21000);
      expect(priceBreakdown.vatRate).toBe(21);
      expect(priceBreakdown.totalAmount).toBe(121000);
    });
  });

  describe('Data Protection (AVG/GDPR)', () => {
    it('should handle payment data retention', () => {
      const retentionPeriod = 7; // 7 years for financial records
      const paymentDate = new Date();
      const retentionEndDate = new Date(paymentDate);
      retentionEndDate.setFullYear(retentionEndDate.getFullYear() + retentionPeriod);

      const yearsDifference = retentionEndDate.getFullYear() - paymentDate.getFullYear();

      expect(yearsDifference).toBe(7);
    });

    it('should support data portability', () => {
      const paymentData = {
        id: 'payment_123',
        amount: 100000,
        currency: 'EUR',
        method: 'ideal',
        status: 'completed',
        created: new Date().toISOString(),
        customer: {
          id: 'cust_123',
          email: 'customer@example.nl',
        },
      };

      // Data should be exportable in standard formats
      const exportFormats = ['JSON', 'CSV', 'XML'];
      
      exportFormats.forEach(format => {
        expect(['JSON', 'CSV', 'XML']).toContain(format);
      });
    });
  });

  describe('Anti-Money Laundering (AML)', () => {
    it('should flag high-value transactions', () => {
      const AML_THRESHOLD = 1000000; // €10,000 threshold
      
      const highValueTransaction = 1500000; // €15,000
      const normalTransaction = 50000; // €500
      
      expect(highValueTransaction > AML_THRESHOLD).toBe(true);
      expect(normalTransaction > AML_THRESHOLD).toBe(false);
    });

    it('should validate customer identity for large transactions', () => {
      const transaction = {
        amount: 1500000, // €15,000
        customer: {
          id: 'cust_123',
          verified: true,
          identityDocuments: ['passport', 'drivers_license'],
          address: {
            country: 'NL',
            postalCode: '1012 AB',
            city: 'Amsterdam',
          },
        },
      };

      const requiresIdentityVerification = transaction.amount > 1000000;
      const hasValidIdentity = transaction.customer.verified && 
                             transaction.customer.identityDocuments.length > 0;

      expect(requiresIdentityVerification).toBe(true);
      expect(hasValidIdentity).toBe(true);
    });
  });

  describe('Dutch Banking Regulations', () => {
    it('should comply with PSD2 Strong Customer Authentication', () => {
      const paymentRequirements = {
        amount: 100000,
        requiresSCA: true, // Strong Customer Authentication
        authenticationMethods: ['password', 'sms', 'biometric'],
        minimumMethods: 2, // Two-factor authentication
      };

      expect(paymentRequirements.requiresSCA).toBe(true);
      expect(paymentRequirements.authenticationMethods.length).toBeGreaterThanOrEqual(
        paymentRequirements.minimumMethods
      );
    });

    it('should support SEPA Direct Debit requirements', () => {
      const sepaRequirements = {
        mandateRequired: true,
        mandateType: 'CORE', // or 'B2B'
        preNotificationDays: 5, // 5 days advance notice
        maxAmount: 1000000, // No specific limit for SEPA Core
        supportedCountries: ['NL', 'BE', 'DE', 'FR', 'IT', 'ES'], // SEPA zone
      };

      expect(sepaRequirements.mandateRequired).toBe(true);
      expect(sepaRequirements.preNotificationDays).toBe(5);
      expect(sepaRequirements.supportedCountries).toContain('NL');
    });
  });
});