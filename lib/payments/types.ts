/**
 * Core payment types and interfaces for Farewelly marketplace
 */

export enum PaymentProvider {
  STRIPE = 'stripe',
  MOLLIE = 'mollie',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentType {
  FAMILY_FEE = 'family_fee',
  PROVIDER_COMMISSION = 'provider_commission',
  GEMEENTEBEGRAFENIS = 'gemeentebegrafenis',
  REGULAR_SERVICE = 'regular_service',
}

export enum DisputeStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

export interface PaymentAmount {
  amount: number; // in cents
  currency: 'EUR';
}

export interface FeeStructure {
  familyFee: PaymentAmount;
  providerCommissionRate: number; // 0.10 - 0.15 (10-15%)
  gemeentebegraafnisReduction: number; // percentage reduction
  platformFeeRate: number; // platform fee rate
}

export interface PaymentSplit {
  providerId: string;
  providerAmount: PaymentAmount;
  platformFee: PaymentAmount;
  commissionFee: PaymentAmount;
  netAmount: PaymentAmount;
}

export interface PaymentIntent {
  id: string;
  provider: PaymentProvider;
  amount: PaymentAmount;
  paymentType: PaymentType;
  customerId: string;
  providerId?: string;
  serviceId: string;
  description: string;
  metadata: Record<string, any>;
  status: PaymentStatus;
  split?: PaymentSplit;
  paymentMethodId?: string;
  clientSecret?: string;
  providerPaymentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefundRequest {
  id: string;
  paymentIntentId: string;
  amount: PaymentAmount;
  reason: string;
  status: PaymentStatus;
  refundId?: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface DisputeCase {
  id: string;
  paymentIntentId: string;
  customerId: string;
  providerId: string;
  reason: string;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface PaymentMethod {
  id: string;
  type: string;
  provider: PaymentProvider;
  customerId: string;
  isDefault: boolean;
  details: Record<string, any>;
  createdAt: Date;
}

export interface PaymentAnalytics {
  totalVolume: PaymentAmount;
  totalTransactions: number;
  averageTransactionValue: PaymentAmount;
  feeRevenue: PaymentAmount;
  commissionRevenue: PaymentAmount;
  refundRate: number;
  disputeRate: number;
  topPaymentMethods: Array<{
    method: string;
    count: number;
    volume: PaymentAmount;
  }>;
  monthlyGrowth: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface PaymentConfig {
  stripe: {
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  mollie: {
    apiKey: string;
    webhookUrl: string;
  };
  feeStructure: FeeStructure;
  currency: 'EUR';
  locale: 'nl-NL';
}

export interface PaymentWebhookEvent {
  id: string;
  provider: PaymentProvider;
  type: string;
  data: any;
  processed: boolean;
  createdAt: Date;
}

export interface PaymentError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaymentResult<T = any> {
  success: boolean;
  data?: T;
  error?: PaymentError;
}

export interface CreatePaymentIntentRequest {
  amount: PaymentAmount;
  paymentType: PaymentType;
  customerId: string;
  providerId?: string;
  serviceId: string;
  description: string;
  metadata?: Record<string, any>;
  paymentMethodId?: string;
  provider?: PaymentProvider;
}

export interface ProcessPaymentRequest {
  paymentIntentId: string;
  paymentMethodId?: string;
  confirmationToken?: string;
}

export interface PaymentMethodRequest {
  customerId: string;
  type: string;
  provider: PaymentProvider;
  details: Record<string, any>;
  setAsDefault?: boolean;
}