/**
 * Payment system configuration for Farewelly marketplace
 */

import { PaymentConfig, FeeStructure } from './types';

export const DEFAULT_FEE_STRUCTURE: FeeStructure = {
  familyFee: {
    amount: 10000, // €100.00 in cents
    currency: 'EUR',
  },
  providerCommissionRate: 0.125, // 12.5% (middle of 10-15% range)
  gemeentebegraafnisReduction: 0.30, // 30% reduction for municipal burials
  platformFeeRate: 0.029, // 2.9% platform fee (typical for EU)
};

export const PAYMENT_LIMITS = {
  MIN_PAYMENT: {
    amount: 100, // €1.00 minimum
    currency: 'EUR' as const,
  },
  MAX_PAYMENT: {
    amount: 5000000, // €50,000.00 maximum
    currency: 'EUR' as const,
  },
};

export const GEMEENTEBEGRAFENIS_CONFIG = {
  maxAmount: {
    amount: 200000, // €2,000.00 maximum for gemeentebegrafenis
    currency: 'EUR' as const,
  },
  eligibleServices: [
    'basic_burial',
    'cremation_basic',
    'municipal_service',
  ],
  requiredDocuments: [
    'income_statement',
    'municipal_approval',
    'death_certificate',
  ],
};

export const MOLLIE_PAYMENT_METHODS = [
  'ideal',           // iDEAL (most popular in Netherlands)
  'bancontact',      // Bancontact
  'sofort',          // SOFORT Banking
  'creditcard',      // Credit/Debit Cards
  'paypal',          // PayPal
  'banktransfer',    // Bank Transfer
  'kbc',             // KBC Payment Button
  'belfius',         // Belfius Pay Button
  'eps',             // EPS
  'giropay',         // Giropay
];

export const STRIPE_PAYMENT_METHODS = [
  'card',            // Credit/Debit Cards
  'sepa_debit',      // SEPA Direct Debit
  'ideal',           // iDEAL
  'bancontact',      // Bancontact
  'sofort',          // SOFORT
  'p24',             // Przelewy24
  'eps',             // EPS
  'giropay',         // Giropay
];

export const WEBHOOK_EVENTS = {
  STRIPE: [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'payment_intent.canceled',
    'charge.dispute.created',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
  ],
  MOLLIE: [
    'payment.paid',
    'payment.failed',
    'payment.canceled',
    'payment.expired',
    'chargeback.created',
    'refund.created',
  ],
};

export const ANALYTICS_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
} as const;

export const DISPUTE_CATEGORIES = [
  'service_not_provided',
  'quality_issues',
  'billing_dispute',
  'unauthorized_charge',
  'processing_error',
  'customer_complaint',
] as const;

export const REFUND_REASONS = [
  'duplicate_charge',
  'fraudulent_charge',
  'service_canceled',
  'service_not_provided',
  'customer_request',
  'processing_error',
  'quality_issue',
] as const;

export function getPaymentConfig(): PaymentConfig {
  return {
    stripe: {
      publicKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    mollie: {
      apiKey: process.env.MOLLIE_API_KEY || '',
      webhookUrl: process.env.MOLLIE_WEBHOOK_URL || '/api/webhooks/mollie',
    },
    feeStructure: DEFAULT_FEE_STRUCTURE,
    currency: 'EUR',
    locale: 'nl-NL',
  };
}

export function calculateFees(baseAmount: number, paymentType: string, isGemeentebegrafenis = false): {
  baseAmount: number;
  platformFee: number;
  commissionFee: number;
  totalFees: number;
  netAmount: number;
} {
  const config = DEFAULT_FEE_STRUCTURE;
  
  let adjustedAmount = baseAmount;
  
  // Apply gemeentebegrafenis reduction if applicable
  if (isGemeentebegrafenis) {
    adjustedAmount = Math.round(baseAmount * (1 - config.gemeentebegraafnisReduction));
  }
  
  const platformFee = Math.round(adjustedAmount * config.platformFeeRate);
  const commissionFee = Math.round(adjustedAmount * config.providerCommissionRate);
  const totalFees = platformFee + commissionFee;
  const netAmount = adjustedAmount - totalFees;
  
  return {
    baseAmount: adjustedAmount,
    platformFee,
    commissionFee,
    totalFees,
    netAmount,
  };
}

export function validatePaymentAmount(amount: number): boolean {
  return amount >= PAYMENT_LIMITS.MIN_PAYMENT.amount && 
         amount <= PAYMENT_LIMITS.MAX_PAYMENT.amount;
}

export function isGemeentebegraafnisEligible(
  amount: number,
  serviceType: string,
  documents: string[]
): boolean {
  // Check amount limit
  if (amount > GEMEENTEBEGRAFENIS_CONFIG.maxAmount.amount) {
    return false;
  }
  
  // Check service type eligibility
  if (!GEMEENTEBEGRAFENIS_CONFIG.eligibleServices.includes(serviceType)) {
    return false;
  }
  
  // Check required documents
  const hasAllDocuments = GEMEENTEBEGRAFENIS_CONFIG.requiredDocuments
    .every(doc => documents.includes(doc));
    
  return hasAllDocuments;
}