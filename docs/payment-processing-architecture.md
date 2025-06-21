# Payment Processing Architecture
## Marketplace Payment System for Dutch Funeral Platform

**Why**: Multi-stakeholder marketplace requires split payments with commission handling and regulatory compliance  
**What**: Stripe Connect/Mollie Partners integration for seamless payment distribution between families and providers  
**How**: Platform facilitates payments with automatic commission splits, escrow, and Dutch tax compliance  

## Core Payment Architecture

### 1. Marketplace Payment Model

#### Payment Flow Overview
```typescript
// lib/payments/types.ts
export interface PaymentTransaction {
  id: string;
  funeralCaseId: string;
  familyId: string;
  
  // Payment structure
  platformFee: number; // €100 for standard, €50 for gemeente
  totalAmount: number; // Platform fee + service costs
  currency: 'EUR';
  
  // Provider splits
  providerPayments: ProviderPayment[];
  
  // Status tracking
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  provider: PaymentProvider;
  
  // External IDs
  stripePaymentIntentId?: string;
  molliePaymentId?: string;
  
  // Timing
  createdAt: Date;
  processedAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
}

export interface ProviderPayment {
  providerId: string;
  providerType: 'director' | 'venue';
  grossAmount: number;
  commissionRate: number; // 10-15%
  commissionAmount: number;
  vatAmount: number; // 21% Dutch VAT
  netPayout: number;
  stripeAccountId?: string;
  mollieAccountId?: string;
}

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partial_refund'
  | 'disputed';

export type PaymentMethod = 
  | 'card'
  | 'ideal'
  | 'bancontact'
  | 'sofort'
  | 'bank_transfer'
  | 'apple_pay'
  | 'google_pay';

export type PaymentProvider = 'stripe' | 'mollie';
```

#### Payment Orchestrator Service
```typescript
// lib/payments/payment-orchestrator.ts
import Stripe from 'stripe';
import { createMollieClient } from '@mollie/api-client';

export class PaymentOrchestrator {
  private stripe: Stripe;
  private mollie: any;
  
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
    
    this.mollie = createMollieClient({
      apiKey: process.env.MOLLIE_API_KEY!,
    });
  }
  
  /**
   * Create marketplace payment intent
   * Handles both platform fee and provider payments
   */
  async createPaymentIntent(
    transactionData: {
      funeralCaseId: string;
      familyId: string;
      platformFee: number;
      providerPayments: ProviderPayment[];
      paymentTier: 'standard' | 'gemeente' | 'premium';
      preferredProvider?: PaymentProvider;
    }
  ): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    provider: PaymentProvider;
    totalAmount: number;
  }> {
    const totalAmount = this.calculateTotalAmount(
      transactionData.platformFee,
      transactionData.providerPayments
    );
    
    // Choose payment provider based on user preference and amount
    const provider = this.selectPaymentProvider(
      transactionData.preferredProvider,
      totalAmount,
      transactionData.paymentTier
    );
    
    if (provider === 'stripe') {
      return await this.createStripePaymentIntent(transactionData, totalAmount);
    } else {
      return await this.createMolliePayment(transactionData, totalAmount);
    }
  }
  
  /**
   * Stripe Connect implementation for marketplace payments
   */
  private async createStripePaymentIntent(
    transactionData: any,
    totalAmount: number
  ): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    provider: PaymentProvider;
    totalAmount: number;
  }> {
    // Calculate platform fee (we keep this)
    const platformFeeAmount = transactionData.platformFee * 100; // Convert to cents
    
    // Create transfers for each provider
    const transfers = await Promise.all(
      transactionData.providerPayments.map(async (payment: ProviderPayment) => {
        const provider = await this.getProviderStripeAccount(payment.providerId);
        
        return {
          destination: provider.stripeAccountId,
          amount: Math.round(payment.netPayout * 100), // Convert to cents
          currency: 'eur',
          metadata: {
            providerId: payment.providerId,
            providerType: payment.providerType,
            funeralCaseId: transactionData.funeralCaseId
          }
        };
      })
    );
    
    // Create payment intent with automatic transfers
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'eur',
      payment_method_types: ['card', 'ideal', 'bancontact'],
      application_fee_amount: platformFeeAmount,
      transfer_data: transfers.length === 1 ? {
        destination: transfers[0].destination,
        amount: transfers[0].amount
      } : undefined,
      metadata: {
        funeralCaseId: transactionData.funeralCaseId,
        familyId: transactionData.familyId,
        paymentTier: transactionData.paymentTier,
        providerCount: transfers.length.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
      // Enable for Dutch market
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
        ideal: {
          setup_future_usage: 'none',
        },
      },
    });
    
    // Handle multiple transfers if needed
    if (transfers.length > 1) {
      await this.createMultipleTransfers(paymentIntent.id, transfers);
    }
    
    // Store transaction in database
    await this.storeTransaction({
      funeralCaseId: transactionData.funeralCaseId,
      familyId: transactionData.familyId,
      platformFee: transactionData.platformFee,
      totalAmount,
      currency: 'EUR',
      providerPayments: transactionData.providerPayments,
      status: 'pending',
      paymentMethod: 'card', // Will be updated on confirmation
      provider: 'stripe',
      stripePaymentIntentId: paymentIntent.id
    });
    
    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      provider: 'stripe',
      totalAmount
    };
  }
  
  /**
   * Mollie Partners implementation for Dutch payment methods
   */
  private async createMolliePayment(
    transactionData: any,
    totalAmount: number
  ): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    provider: PaymentProvider;
    totalAmount: number;
  }> {
    // Create main payment
    const payment = await this.mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: totalAmount.toFixed(2)
      },
      description: `Funeral service payment - Case ${transactionData.funeralCaseId}`,
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/mollie/webhook`,
      method: ['ideal', 'creditcard', 'bancontact', 'sofort'],
      metadata: {
        funeralCaseId: transactionData.funeralCaseId,
        familyId: transactionData.familyId,
        paymentTier: transactionData.paymentTier
      }
    });
    
    // Store pending transfers for later processing
    await this.storePendingMollieTransfers(payment.id, transactionData.providerPayments);
    
    // Store transaction in database
    await this.storeTransaction({
      funeralCaseId: transactionData.funeralCaseId,
      familyId: transactionData.familyId,
      platformFee: transactionData.platformFee,
      totalAmount,
      currency: 'EUR',
      providerPayments: transactionData.providerPayments,
      status: 'pending',
      paymentMethod: 'ideal', // Most common in NL
      provider: 'mollie',
      molliePaymentId: payment.id
    });
    
    return {
      paymentIntentId: payment.id,
      clientSecret: payment.getCheckoutUrl()!,
      provider: 'mollie',
      totalAmount
    };
  }
  
  private calculateTotalAmount(
    platformFee: number,
    providerPayments: ProviderPayment[]
  ): number {
    const providerTotal = providerPayments.reduce(
      (sum, payment) => sum + payment.grossAmount,
      0
    );
    return platformFee + providerTotal;
  }
  
  private selectPaymentProvider(
    preferredProvider: PaymentProvider | undefined,
    amount: number,
    paymentTier: string
  ): PaymentProvider {
    // For gemeente families, prefer Mollie (better Dutch payment methods)
    if (paymentTier === 'gemeente') {
      return 'mollie';
    }
    
    // For large amounts, prefer Stripe (better international support)
    if (amount > 5000) {
      return 'stripe';
    }
    
    // Default to user preference or Mollie for Dutch market
    return preferredProvider || 'mollie';
  }
}
```

### 2. Commission Management System

#### Commission Calculator
```typescript
// lib/payments/commission-calculator.ts
export class CommissionCalculator {
  
  /**
   * Calculate commission based on provider type and usage
   */
  calculateCommission(
    providerType: 'director' | 'venue',
    grossAmount: number,
    hasDirectorCode: boolean,
    paymentTier: 'standard' | 'gemeente' | 'premium'
  ): {
    commissionRate: number;
    commissionAmount: number;
    vatAmount: number;
    netPayout: number;
  } {
    // Base commission rates
    let commissionRate: number;
    
    if (providerType === 'director') {
      if (hasDirectorCode) {
        commissionRate = 0.15; // 15% when director provides code
      } else {
        commissionRate = 0.10; // 10% standard rate
      }
    } else { // venue
      commissionRate = 0.15; // 15% for venues
    }
    
    // Adjust for payment tier
    if (paymentTier === 'gemeente') {
      commissionRate *= 0.8; // 20% reduction for gemeente cases
    } else if (paymentTier === 'premium') {
      commissionRate *= 1.1; // 10% increase for premium service
    }
    
    const commissionAmount = grossAmount * commissionRate;
    const netBeforeVat = grossAmount - commissionAmount;
    const vatAmount = commissionAmount * 0.21; // 21% Dutch VAT on commission
    const netPayout = netBeforeVat;
    
    return {
      commissionRate,
      commissionAmount,
      vatAmount,
      netPayout
    };
  }
  
  /**
   * Calculate platform fees based on family payment tier
   */
  calculatePlatformFee(paymentTier: 'standard' | 'gemeente' | 'premium'): number {
    switch (paymentTier) {
      case 'standard':
        return 100; // €100
      case 'gemeente':
        return 50;  // €50 reduced rate
      case 'premium':
        return 150; // €150 for premium service
      default:
        return 100;
    }
  }
}
```

### 3. Provider Onboarding & Account Management

#### Stripe Connect Onboarding
```typescript
// lib/payments/provider-onboarding.ts
export class ProviderPaymentOnboarding {
  private stripe: Stripe;
  
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }
  
  /**
   * Create Stripe Express account for providers
   */
  async createStripeAccount(
    providerId: string,
    providerData: {
      email: string;
      companyName?: string;
      businessType: 'individual' | 'company';
      kvkNumber?: string;
      country: string;
    }
  ): Promise<{
    accountId: string;
    onboardingUrl: string;
  }> {
    // Create Express account
    const account = await this.stripe.accounts.create({
      type: 'express',
      country: providerData.country,
      email: providerData.email,
      business_type: providerData.businessType,
      company: providerData.businessType === 'company' ? {
        name: providerData.companyName,
        tax_id: providerData.kvkNumber,
      } : undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        mcc: '7299', // Miscellaneous Personal Services
        product_description: 'Funeral and memorial services',
      },
      tos_acceptance: {
        service_agreement: 'recipient',
      },
    });
    
    // Create onboarding link
    const accountLink = await this.stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/payment/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/payment/complete`,
      type: 'account_onboarding',
    });
    
    // Store account info
    await this.storeProviderPaymentAccount({
      providerId,
      stripeAccountId: account.id,
      accountStatus: 'pending',
      onboardingCompleted: false,
    });
    
    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  }
  
  /**
   * Create Mollie partner profile for Dutch providers
   */
  async createMollieProfile(
    providerId: string,
    providerData: {
      email: string;
      companyName: string;
      kvkNumber: string;
      businessType: 'sole_trader' | 'partnership' | 'corporation';
    }
  ): Promise<{
    profileId: string;
    onboardingUrl: string;
  }> {
    // Create Mollie organization profile
    const profile = await this.mollie.organizations.create({
      name: providerData.companyName,
      email: providerData.email,
      locale: 'nl_NL',
      website: `${process.env.NEXT_PUBLIC_BASE_URL}/providers/${providerId}`,
    });
    
    // Store profile info
    await this.storeProviderPaymentAccount({
      providerId,
      mollieProfileId: profile.id,
      accountStatus: 'pending',
      onboardingCompleted: false,
    });
    
    return {
      profileId: profile.id,
      onboardingUrl: profile.dashboard.url,
    };
  }
  
  /**
   * Verify account status and capabilities
   */
  async verifyAccountStatus(
    providerId: string
  ): Promise<{
    canReceivePayments: boolean;
    missingRequirements: string[];
    accountStatus: string;
  }> {
    const paymentAccount = await this.getProviderPaymentAccount(providerId);
    
    if (paymentAccount.stripeAccountId) {
      return await this.verifyStripeAccount(paymentAccount.stripeAccountId);
    } else if (paymentAccount.mollieProfileId) {
      return await this.verifyMollieProfile(paymentAccount.mollieProfileId);
    }
    
    throw new Error('No payment account found for provider');
  }
  
  private async verifyStripeAccount(accountId: string) {
    const account = await this.stripe.accounts.retrieve(accountId);
    
    return {
      canReceivePayments: account.charges_enabled && account.payouts_enabled,
      missingRequirements: account.requirements?.currently_due || [],
      accountStatus: account.details_submitted ? 'active' : 'pending',
    };
  }
}
```

### 4. Payment Webhooks & Event Handling

#### Webhook Processing
```typescript
// app/api/payments/webhooks/stripe/route.ts
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { PaymentEventProcessor } from '@/lib/payments/event-processor';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const processor = new PaymentEventProcessor();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  try {
    await processor.processStripeEvent(event);
    return Response.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: 'Processing failed' }, { status: 500 });
  }
}

// lib/payments/event-processor.ts
export class PaymentEventProcessor {
  
  async processStripeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'account.updated':
        await this.handleAccountUpdated(event.data.object as Stripe.Account);
        break;
        
      case 'transfer.created':
        await this.handleTransferCreated(event.data.object as Stripe.Transfer);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }
  
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const funeralCaseId = paymentIntent.metadata.funeralCaseId;
    
    // Update transaction status
    await this.updateTransactionStatus(paymentIntent.id, 'succeeded');
    
    // Trigger business logic
    await this.triggerPaymentSuccessWorkflow(funeralCaseId);
    
    // Send confirmations
    await this.sendPaymentConfirmations(funeralCaseId);
    
    // Update case status
    await this.updateFuneralCasePaymentStatus(funeralCaseId, 'paid');
  }
  
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const funeralCaseId = paymentIntent.metadata.funeralCaseId;
    
    // Update transaction status
    await this.updateTransactionStatus(paymentIntent.id, 'failed');
    
    // Notify family of failure
    await this.sendPaymentFailureNotification(funeralCaseId);
    
    // Suggest alternative payment methods
    await this.suggestAlternativePaymentMethods(funeralCaseId);
  }
  
  private async triggerPaymentSuccessWorkflow(funeralCaseId: string): Promise<void> {
    // Trigger LangGraph workflow for post-payment processing
    await this.workflowOrchestrator.resumeWorkflow(funeralCaseId, {
      type: 'payment_completed',
      status: 'success',
      timestamp: new Date().toISOString()
    });
  }
}
```

### 5. Escrow & Dispute Handling

#### Escrow Management
```typescript
// lib/payments/escrow-manager.ts
export class EscrowManager {
  
  /**
   * Hold funds in escrow until service completion
   */
  async createEscrowHold(
    transactionId: string,
    holdDurationDays: number = 14
  ): Promise<{
    escrowId: string;
    releaseDate: Date;
  }> {
    const transaction = await this.getTransaction(transactionId);
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + holdDurationDays);
    
    // Create escrow record
    const escrow = await this.createEscrowRecord({
      transactionId,
      amount: transaction.totalAmount,
      status: 'held',
      releaseDate,
      reason: 'service_completion_pending'
    });
    
    // Schedule automatic release
    await this.scheduleEscrowRelease(escrow.id, releaseDate);
    
    return {
      escrowId: escrow.id,
      releaseDate
    };
  }
  
  /**
   * Handle payment disputes
   */
  async handleDispute(
    transactionId: string,
    disputeReason: string,
    initiatedBy: 'family' | 'provider'
  ): Promise<{
    disputeId: string;
    status: string;
    nextSteps: string[];
  }> {
    // Create dispute record
    const dispute = await this.createDisputeRecord({
      transactionId,
      reason: disputeReason,
      initiatedBy,
      status: 'open',
      createdAt: new Date()
    });
    
    // Hold funds during dispute
    await this.extendEscrowHold(transactionId, 30); // 30 days
    
    // Notify all parties
    await this.notifyDisputeParties(transactionId, dispute.id);
    
    return {
      disputeId: dispute.id,
      status: 'open',
      nextSteps: [
        'Gather evidence from both parties',
        'Review service agreement',
        'Attempt mediation',
        'Final decision within 14 days'
      ]
    };
  }
}
```

This payment processing architecture provides a comprehensive marketplace solution that handles the complexity of multi-party payments while ensuring regulatory compliance with Dutch financial laws and providing excellent user experience for all stakeholders.