/**
 * Payment splitting logic for Farewelly marketplace
 */

import {
  PaymentSplit,
  PaymentAmount,
  PaymentType,
  PaymentIntent,
  PaymentResult,
} from './types';
import { 
  DEFAULT_FEE_STRUCTURE, 
  calculateFees, 
  isGemeentebegraafnisEligible,
  GEMEENTEBEGRAFENIS_CONFIG 
} from './config';

export interface SplitCalculationRequest {
  baseAmount: number;
  paymentType: PaymentType;
  providerId: string;
  serviceType?: string;
  submittedDocuments?: string[];
  customFeeStructure?: Partial<typeof DEFAULT_FEE_STRUCTURE>;
}

export interface SplitResult {
  split: PaymentSplit;
  breakdown: {
    originalAmount: number;
    adjustedAmount: number;
    reductionApplied: number;
    platformFee: number;
    commissionFee: number;
    providerNet: number;
    totalFees: number;
  };
  eligibility: {
    isGemeentebegrafenis: boolean;
    reductionApplied: boolean;
    reasonForReduction?: string;
  };
}

export class PaymentSplittingService {
  /**
   * Calculate payment split for marketplace transaction
   */
  calculateSplit(request: SplitCalculationRequest): PaymentResult<SplitResult> {
    try {
      const {
        baseAmount,
        paymentType,
        providerId,
        serviceType,
        submittedDocuments = [],
        customFeeStructure,
      } = request;

      // Merge custom fee structure if provided
      const feeStructure = {
        ...DEFAULT_FEE_STRUCTURE,
        ...customFeeStructure,
      };

      // Check if gemeentebegrafenis reduction applies
      const isGemeentebegrafenis = paymentType === PaymentType.GEMEENTEBEGRAFENIS;
      const isEligibleForReduction = isGemeentebegrafenis && 
        serviceType && 
        isGemeentebegraafnisEligible(baseAmount, serviceType, submittedDocuments);

      // Calculate fees with potential reduction
      const fees = calculateFees(baseAmount, paymentType, isEligibleForReduction);
      
      // Create payment split
      const split: PaymentSplit = {
        providerId,
        providerAmount: {
          amount: fees.netAmount,
          currency: 'EUR',
        },
        platformFee: {
          amount: fees.platformFee,
          currency: 'EUR',
        },
        commissionFee: {
          amount: fees.commissionFee,
          currency: 'EUR',
        },
        netAmount: {
          amount: fees.netAmount,
          currency: 'EUR',
        },
      };

      const result: SplitResult = {
        split,
        breakdown: {
          originalAmount: baseAmount,
          adjustedAmount: fees.baseAmount,
          reductionApplied: baseAmount - fees.baseAmount,
          platformFee: fees.platformFee,
          commissionFee: fees.commissionFee,
          providerNet: fees.netAmount,
          totalFees: fees.totalFees,
        },
        eligibility: {
          isGemeentebegrafenis,
          reductionApplied: isEligibleForReduction,
          reasonForReduction: isEligibleForReduction ? 
            'Gemeentebegrafenis reduction applied' : undefined,
        },
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SPLIT_CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to calculate payment split',
          details: { error },
        },
      };
    }
  }

  /**
   * Calculate family fee structure
   */
  calculateFamilyFee(
    numberOfServices: number,
    serviceTypes: string[],
    isGemeentebegrafenis = false
  ): PaymentResult<{
    baseFee: PaymentAmount;
    adjustedFee: PaymentAmount;
    savings: PaymentAmount;
  }> {
    try {
      const baseFee = DEFAULT_FEE_STRUCTURE.familyFee;
      
      // Apply gemeentebegrafenis reduction if applicable
      let adjustedAmount = baseFee.amount;
      if (isGemeentebegrafenis) {
        adjustedAmount = Math.round(
          baseFee.amount * (1 - DEFAULT_FEE_STRUCTURE.gemeentebegraafnisReduction)
        );
      }

      const savings = baseFee.amount - adjustedAmount;

      return {
        success: true,
        data: {
          baseFee: baseFee,
          adjustedFee: {
            amount: adjustedAmount,
            currency: 'EUR',
          },
          savings: {
            amount: savings,
            currency: 'EUR',
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FAMILY_FEE_CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to calculate family fee',
          details: { error },
        },
      };
    }
  }

  /**
   * Process marketplace payout to provider
   */
  async processProviderPayout(
    paymentIntent: PaymentIntent,
    split: PaymentSplit
  ): Promise<PaymentResult<{ payoutId: string; amount: PaymentAmount }>> {
    try {
      // This would integrate with Stripe Connect or similar service
      // For now, we'll simulate the payout process
      
      const payoutAmount = split.netAmount;
      const payoutId = `payout_${Date.now()}_${split.providerId}`;

      // Log the payout for tracking
      console.log(`Processing payout: ${payoutId}`, {
        providerId: split.providerId,
        amount: payoutAmount,
        paymentIntentId: paymentIntent.id,
        timestamp: new Date().toISOString(),
      });

      // In a real implementation, this would:
      // 1. Create a transfer to the provider's connected account
      // 2. Handle payout schedules (daily, weekly, monthly)
      // 3. Apply any additional fees or taxes
      // 4. Update provider balance
      // 5. Send payout notifications

      return {
        success: true,
        data: {
          payoutId,
          amount: payoutAmount,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROVIDER_PAYOUT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process provider payout',
          details: { error },
        },
      };
    }
  }

  /**
   * Calculate commission structure for different provider tiers
   */
  calculateTieredCommission(
    baseAmount: number,
    providerTier: 'bronze' | 'silver' | 'gold' | 'platinum',
    monthlyVolume: number
  ): PaymentResult<{
    commissionRate: number;
    commissionAmount: number;
    tierBenefits: string[];
  }> {
    try {
      // Define tier-based commission rates
      const tierRates = {
        bronze: 0.15,   // 15%
        silver: 0.13,   // 13%
        gold: 0.11,     // 11%
        platinum: 0.10, // 10%
      };

      // Volume-based adjustments
      let volumeAdjustment = 0;
      if (monthlyVolume > 50000) volumeAdjustment = -0.005; // -0.5%
      if (monthlyVolume > 100000) volumeAdjustment = -0.01; // -1%
      if (monthlyVolume > 200000) volumeAdjustment = -0.015; // -1.5%

      const baseRate = tierRates[providerTier];
      const adjustedRate = Math.max(0.08, baseRate + volumeAdjustment); // Min 8%
      const commissionAmount = Math.round(baseAmount * adjustedRate);

      const tierBenefits = this.getTierBenefits(providerTier);

      return {
        success: true,
        data: {
          commissionRate: adjustedRate,
          commissionAmount,
          tierBenefits,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TIERED_COMMISSION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to calculate tiered commission',
          details: { error },
        },
      };
    }
  }

  /**
   * Handle split payments for complex scenarios
   */
  handleComplexSplit(
    baseAmount: number,
    splits: Array<{
      providerId: string;
      percentage: number;
      role: 'primary' | 'secondary' | 'vendor';
    }>
  ): PaymentResult<PaymentSplit[]> {
    try {
      // Validate splits total 100%
      const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error('Split percentages must total 100%');
      }

      const results: PaymentSplit[] = [];

      for (const splitConfig of splits) {
        const providerAmount = Math.round(baseAmount * (splitConfig.percentage / 100));
        const fees = calculateFees(providerAmount, PaymentType.REGULAR_SERVICE);

        const split: PaymentSplit = {
          providerId: splitConfig.providerId,
          providerAmount: { amount: providerAmount, currency: 'EUR' },
          platformFee: { amount: fees.platformFee, currency: 'EUR' },
          commissionFee: { amount: fees.commissionFee, currency: 'EUR' },
          netAmount: { amount: fees.netAmount, currency: 'EUR' },
        };

        results.push(split);
      }

      return { success: true, data: results };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPLEX_SPLIT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to handle complex split',
          details: { error },
        },
      };
    }
  }

  private getTierBenefits(tier: string): string[] {
    const benefits = {
      bronze: [
        'Basic marketplace access',
        'Standard support',
        '15% commission rate',
      ],
      silver: [
        'Priority listing',
        'Enhanced support',
        '13% commission rate',
        'Monthly analytics reports',
      ],
      gold: [
        'Featured provider status',
        'Priority support',
        '11% commission rate',
        'Weekly analytics reports',
        'Marketing co-op opportunities',
      ],
      platinum: [
        'Premium provider status',
        'Dedicated account manager',
        '10% commission rate',
        'Real-time analytics',
        'Co-marketing opportunities',
        'Early access to new features',
      ],
    };

    return benefits[tier as keyof typeof benefits] || [];
  }
}