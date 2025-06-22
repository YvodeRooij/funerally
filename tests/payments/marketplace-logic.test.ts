/**
 * Marketplace Logic Tests - Fee calculation, commission splits, platform charges
 * Tests all marketplace financial calculations and split logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentSplittingService } from '@/lib/payments/splitting';
import { PaymentType } from '@/lib/payments/types';
import { 
  calculateFees, 
  DEFAULT_FEE_STRUCTURE,
  isGemeentebegraafnisEligible,
  validatePaymentAmount 
} from '@/lib/payments/config';

describe('Fee Calculation', () => {
  describe('Basic Fee Structure', () => {
    it('should calculate standard fees correctly', () => {
      const baseAmount = 100000; // €1000.00 in cents
      const fees = calculateFees(baseAmount, PaymentType.REGULAR_SERVICE);

      expect(fees.baseAmount).toBe(100000);
      expect(fees.platformFee).toBe(2900); // 2.9% of 100000
      expect(fees.commissionFee).toBe(12500); // 12.5% of 100000
      expect(fees.totalFees).toBe(15400); // 2900 + 12500
      expect(fees.netAmount).toBe(84600); // 100000 - 15400
    });

    it('should apply gemeentebegrafenis reduction', () => {
      const baseAmount = 100000; // €1000.00 in cents
      const fees = calculateFees(baseAmount, PaymentType.GEMEENTEBEGRAFENIS, true);

      expect(fees.baseAmount).toBe(70000); // 30% reduction applied
      expect(fees.platformFee).toBe(2030); // 2.9% of 70000
      expect(fees.commissionFee).toBe(8750); // 12.5% of 70000
      expect(fees.totalFees).toBe(10780);
      expect(fees.netAmount).toBe(59220); // 70000 - 10780
    });

    it('should calculate family fee correctly', () => {
      const familyFeeAmount = DEFAULT_FEE_STRUCTURE.familyFee.amount;
      const fees = calculateFees(familyFeeAmount, PaymentType.FAMILY_FEE);

      expect(fees.baseAmount).toBe(10000); // €100.00
      expect(fees.platformFee).toBe(290); // 2.9% of 10000
      expect(fees.commissionFee).toBe(1250); // 12.5% of 10000
      expect(fees.totalFees).toBe(1540);
      expect(fees.netAmount).toBe(8460);
    });

    it('should handle provider commission payments', () => {
      const baseAmount = 50000; // €500.00 in cents
      const fees = calculateFees(baseAmount, PaymentType.PROVIDER_COMMISSION);

      expect(fees.baseAmount).toBe(50000);
      expect(fees.platformFee).toBe(1450); // 2.9% of 50000
      expect(fees.commissionFee).toBe(6250); // 12.5% of 50000
      expect(fees.totalFees).toBe(7700);
      expect(fees.netAmount).toBe(42300);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum payment amounts', () => {
      const minAmount = 100; // €1.00 minimum
      const fees = calculateFees(minAmount, PaymentType.REGULAR_SERVICE);

      expect(fees.baseAmount).toBe(100);
      expect(fees.platformFee).toBe(3); // Rounded
      expect(fees.commissionFee).toBe(13); // Rounded
      expect(fees.totalFees).toBe(16);
      expect(fees.netAmount).toBe(84);
    });

    it('should handle large payment amounts', () => {
      const largeAmount = 5000000; // €50,000.00 maximum
      const fees = calculateFees(largeAmount, PaymentType.REGULAR_SERVICE);

      expect(fees.baseAmount).toBe(5000000);
      expect(fees.platformFee).toBe(145000); // 2.9% of 5000000
      expect(fees.commissionFee).toBe(625000); // 12.5% of 5000000
      expect(fees.totalFees).toBe(770000);
      expect(fees.netAmount).toBe(4230000);
    });

    it('should round fee calculations correctly', () => {
      const oddAmount = 33333; // Amount that creates rounding scenarios
      const fees = calculateFees(oddAmount, PaymentType.REGULAR_SERVICE);

      expect(fees.platformFee).toBe(967); // Math.round(33333 * 0.029)
      expect(fees.commissionFee).toBe(4167); // Math.round(33333 * 0.125)
      expect(fees.totalFees).toBe(5134);
      expect(fees.netAmount).toBe(28199);
    });
  });

  describe('Payment Validation', () => {
    it('should validate payment amounts within limits', () => {
      expect(validatePaymentAmount(100)).toBe(true); // Minimum
      expect(validatePaymentAmount(5000000)).toBe(true); // Maximum
      expect(validatePaymentAmount(100000)).toBe(true); // Normal amount
    });

    it('should reject amounts below minimum', () => {
      expect(validatePaymentAmount(99)).toBe(false);
      expect(validatePaymentAmount(0)).toBe(false);
      expect(validatePaymentAmount(-100)).toBe(false);
    });

    it('should reject amounts above maximum', () => {
      expect(validatePaymentAmount(5000001)).toBe(false);
      expect(validatePaymentAmount(10000000)).toBe(false);
    });
  });
});

describe('Gemeentebegrafenis Eligibility', () => {
  const eligibleDocuments = [
    'income_statement',
    'municipal_approval',
    'death_certificate'
  ];

  it('should approve eligible gemeentebegrafenis requests', () => {
    const isEligible = isGemeentebegraafnisEligible(
      150000, // €1500.00 (under limit)
      'basic_burial',
      eligibleDocuments
    );

    expect(isEligible).toBe(true);
  });

  it('should reject requests above amount limit', () => {
    const isEligible = isGemeentebegraafnisEligible(
      250000, // €2500.00 (over €2000 limit)
      'basic_burial',
      eligibleDocuments
    );

    expect(isEligible).toBe(false);
  });

  it('should reject ineligible service types', () => {
    const isEligible = isGemeentebegraafnisEligible(
      150000,
      'premium_burial', // Not in eligible services
      eligibleDocuments
    );

    expect(isEligible).toBe(false);
  });

  it('should reject requests with missing documents', () => {
    const incompleteDocuments = ['income_statement', 'death_certificate']; // Missing municipal_approval

    const isEligible = isGemeentebegraafnisEligible(
      150000,
      'basic_burial',
      incompleteDocuments
    );

    expect(isEligible).toBe(false);
  });

  it('should handle edge case at exact limit', () => {
    const isEligible = isGemeentebegraafnisEligible(
      200000, // Exactly €2000.00
      'cremation_basic',
      eligibleDocuments
    );

    expect(isEligible).toBe(true);
  });
});

describe('Payment Splitting Service', () => {
  let splittingService: PaymentSplittingService;

  beforeEach(() => {
    splittingService = new PaymentSplittingService();
  });

  describe('Basic Split Calculation', () => {
    it('should calculate standard marketplace split', () => {
      const request = {
        baseAmount: 100000, // €1000.00
        paymentType: PaymentType.REGULAR_SERVICE,
        providerId: 'provider_123',
      };

      const result = splittingService.calculateSplit(request);

      expect(result.success).toBe(true);
      expect(result.data?.split.providerId).toBe('provider_123');
      expect(result.data?.split.platformFee.amount).toBe(2900); // 2.9%
      expect(result.data?.split.commissionFee.amount).toBe(12500); // 12.5%
      expect(result.data?.split.netAmount.amount).toBe(84600);
      
      expect(result.data?.breakdown.originalAmount).toBe(100000);
      expect(result.data?.breakdown.totalFees).toBe(15400);
      expect(result.data?.eligibility.isGemeentebegrafenis).toBe(false);
    });

    it('should calculate gemeentebegrafenis split with reduction', () => {
      const request = {
        baseAmount: 100000, // €1000.00
        paymentType: PaymentType.GEMEENTEBEGRAFENIS,
        providerId: 'provider_123',
        serviceType: 'basic_burial',
        submittedDocuments: [
          'income_statement',
          'municipal_approval',
          'death_certificate'
        ],
      };

      const result = splittingService.calculateSplit(request);

      expect(result.success).toBe(true);
      expect(result.data?.breakdown.originalAmount).toBe(100000);
      expect(result.data?.breakdown.adjustedAmount).toBe(70000); // 30% reduction
      expect(result.data?.breakdown.reductionApplied).toBe(30000);
      expect(result.data?.eligibility.isGemeentebegrafenis).toBe(true);
      expect(result.data?.eligibility.reductionApplied).toBe(true);
      expect(result.data?.eligibility.reasonForReduction).toBe('Gemeentebegrafenis reduction applied');
    });

    it('should handle ineligible gemeentebegrafenis requests', () => {
      const request = {
        baseAmount: 250000, // Over limit
        paymentType: PaymentType.GEMEENTEBEGRAFENIS,
        providerId: 'provider_123',
        serviceType: 'premium_burial',
        submittedDocuments: ['income_statement'], // Missing documents
      };

      const result = splittingService.calculateSplit(request);

      expect(result.success).toBe(true);
      expect(result.data?.breakdown.originalAmount).toBe(250000);
      expect(result.data?.breakdown.adjustedAmount).toBe(250000); // No reduction
      expect(result.data?.breakdown.reductionApplied).toBe(0);
      expect(result.data?.eligibility.isGemeentebegrafenis).toBe(true);
      expect(result.data?.eligibility.reductionApplied).toBe(false);
    });

    it('should apply custom fee structure', () => {
      const customFeeStructure = {
        platformFeeRate: 0.035, // 3.5% instead of 2.9%
        providerCommissionRate: 0.15, // 15% instead of 12.5%
      };

      const request = {
        baseAmount: 100000,
        paymentType: PaymentType.REGULAR_SERVICE,
        providerId: 'provider_123',
        customFeeStructure,
      };

      const result = splittingService.calculateSplit(request);

      expect(result.success).toBe(true);
      expect(result.data?.split.platformFee.amount).toBe(3500); // 3.5%
      expect(result.data?.split.commissionFee.amount).toBe(15000); // 15%
    });
  });

  describe('Family Fee Calculation', () => {
    it('should calculate standard family fee', () => {
      const result = splittingService.calculateFamilyFee(1, ['basic_service'], false);

      expect(result.success).toBe(true);
      expect(result.data?.baseFee.amount).toBe(10000); // €100.00
      expect(result.data?.adjustedFee.amount).toBe(10000); // No reduction
      expect(result.data?.savings.amount).toBe(0);
    });

    it('should apply gemeentebegrafenis reduction to family fee', () => {
      const result = splittingService.calculateFamilyFee(1, ['basic_burial'], true);

      expect(result.success).toBe(true);
      expect(result.data?.baseFee.amount).toBe(10000); // €100.00
      expect(result.data?.adjustedFee.amount).toBe(7000); // 30% reduction
      expect(result.data?.savings.amount).toBe(3000); // €30.00 savings
    });
  });

  describe('Tiered Commission Structure', () => {
    it('should calculate bronze tier commission', () => {
      const result = splittingService.calculateTieredCommission(
        100000, // €1000.00
        'bronze',
        10000 // €100.00 monthly volume
      );

      expect(result.success).toBe(true);
      expect(result.data?.commissionRate).toBe(0.15); // 15%
      expect(result.data?.commissionAmount).toBe(15000); // €150.00
      expect(result.data?.tierBenefits).toContain('15% commission rate');
    });

    it('should calculate silver tier commission', () => {
      const result = splittingService.calculateTieredCommission(
        100000,
        'silver',
        25000
      );

      expect(result.success).toBe(true);
      expect(result.data?.commissionRate).toBe(0.13); // 13%
      expect(result.data?.commissionAmount).toBe(13000);
      expect(result.data?.tierBenefits).toContain('13% commission rate');
    });

    it('should calculate gold tier commission', () => {
      const result = splittingService.calculateTieredCommission(
        100000,
        'gold',
        40000
      );

      expect(result.success).toBe(true);
      expect(result.data?.commissionRate).toBe(0.11); // 11%
      expect(result.data?.commissionAmount).toBe(11000);
      expect(result.data?.tierBenefits).toContain('11% commission rate');
    });

    it('should calculate platinum tier commission', () => {
      const result = splittingService.calculateTieredCommission(
        100000,
        'platinum',
        60000
      );

      expect(result.success).toBe(true);
      expect(result.data?.commissionRate).toBe(0.10); // 10%
      expect(result.data?.commissionAmount).toBe(10000);
      expect(result.data?.tierBenefits).toContain('10% commission rate');
    });

    it('should apply volume-based discounts', () => {
      // High volume should reduce commission rate
      const result = splittingService.calculateTieredCommission(
        100000,
        'bronze',
        250000 // €2500.00 monthly volume (high)
      );

      expect(result.success).toBe(true);
      expect(result.data?.commissionRate).toBe(0.135); // 15% - 1.5% volume discount
      expect(result.data?.commissionAmount).toBe(13500);
    });

    it('should respect minimum commission rate', () => {
      // Even with maximum volume discount, shouldn't go below 8%
      const result = splittingService.calculateTieredCommission(
        100000,
        'platinum',
        500000 // Very high volume
      );

      expect(result.success).toBe(true);
      expect(result.data?.commissionRate).toBeGreaterThanOrEqual(0.08); // Minimum 8%
    });
  });

  describe('Complex Split Scenarios', () => {
    it('should handle multi-provider splits', () => {
      const splits = [
        { providerId: 'director_123', percentage: 60, role: 'primary' as const },
        { providerId: 'venue_456', percentage: 30, role: 'secondary' as const },
        { providerId: 'vendor_789', percentage: 10, role: 'vendor' as const },
      ];

      const result = splittingService.handleComplexSplit(100000, splits);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      
      const [directorSplit, venueSplit, vendorSplit] = result.data!;
      
      expect(directorSplit.providerId).toBe('director_123');
      expect(directorSplit.providerAmount.amount).toBe(60000); // 60%
      
      expect(venueSplit.providerId).toBe('venue_456');
      expect(venueSplit.providerAmount.amount).toBe(30000); // 30%
      
      expect(vendorSplit.providerId).toBe('vendor_789');
      expect(vendorSplit.providerAmount.amount).toBe(10000); // 10%
    });

    it('should reject splits that don\'t total 100%', () => {
      const invalidSplits = [
        { providerId: 'director_123', percentage: 60, role: 'primary' as const },
        { providerId: 'venue_456', percentage: 30, role: 'secondary' as const },
        // Missing 10% - only totals 90%
      ];

      const result = splittingService.handleComplexSplit(100000, invalidSplits);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Split percentages must total 100%');
    });

    it('should handle splits with small percentages', () => {
      const splits = [
        { providerId: 'primary_123', percentage: 97, role: 'primary' as const },
        { providerId: 'vendor_456', percentage: 2, role: 'vendor' as const },
        { providerId: 'other_789', percentage: 1, role: 'vendor' as const },
      ];

      const result = splittingService.handleComplexSplit(100000, splits);

      expect(result.success).toBe(true);
      expect(result.data![0].providerAmount.amount).toBe(97000); // 97%
      expect(result.data![1].providerAmount.amount).toBe(2000); // 2%
      expect(result.data![2].providerAmount.amount).toBe(1000); // 1%
    });
  });

  describe('Provider Payout Processing', () => {
    it('should simulate provider payout successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        provider: 'stripe' as any,
        amount: { amount: 100000, currency: 'EUR' as const },
        paymentType: PaymentType.REGULAR_SERVICE,
        customerId: 'cust_123',
        serviceId: 'service_123',
        description: 'Test payment',
        metadata: {},
        status: 'completed' as any,
        providerPaymentId: 'pi_test_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSplit = {
        providerId: 'provider_123',
        providerAmount: { amount: 84600, currency: 'EUR' as const },
        platformFee: { amount: 2900, currency: 'EUR' as const },
        commissionFee: { amount: 12500, currency: 'EUR' as const },
        netAmount: { amount: 84600, currency: 'EUR' as const },
      };

      const result = await splittingService.processProviderPayout(
        mockPaymentIntent,
        mockSplit
      );

      expect(result.success).toBe(true);
      expect(result.data?.payoutId).toMatch(/^payout_\d+_provider_123$/);
      expect(result.data?.amount.amount).toBe(84600);
    });
  });

  describe('Error Handling', () => {
    it('should handle calculation errors gracefully', () => {
      const invalidRequest = {
        baseAmount: -100, // Invalid negative amount
        paymentType: PaymentType.REGULAR_SERVICE,
        providerId: '',
      };

      const result = splittingService.calculateSplit(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SPLIT_CALCULATION_ERROR');
    });

    it('should handle missing provider ID', () => {
      const request = {
        baseAmount: 100000,
        paymentType: PaymentType.REGULAR_SERVICE,
        providerId: '', // Empty provider ID
      };

      const result = splittingService.calculateSplit(request);

      expect(result.success).toBe(true); // Should still work but split will be empty
      expect(result.data?.split.providerId).toBe('');
    });
  });
});