/**
 * Payment Testing Configuration
 * Centralized configuration for all payment-related tests
 */

export const TEST_CONFIG = {
  // Test environment settings
  environment: {
    name: process.env.NODE_ENV || 'test',
    apiUrl: process.env.TEST_API_URL || 'http://localhost:3000',
    paymentWebhookUrl: process.env.TEST_WEBHOOK_URL || 'http://localhost:3000/api/webhooks',
  },

  // Payment provider test credentials
  providers: {
    stripe: {
      publishableKey: process.env.STRIPE_TEST_PUBLISHABLE_KEY || 'pk_test_...',
      secretKey: process.env.STRIPE_TEST_SECRET_KEY || 'sk_test_...',
      webhookSecret: process.env.STRIPE_TEST_WEBHOOK_SECRET || 'whsec_test_...',
      connectAccountId: process.env.STRIPE_TEST_CONNECT_ACCOUNT || 'acct_test_...',
    },
    mollie: {
      apiKey: process.env.MOLLIE_TEST_API_KEY || 'test_...',
      webhookUrl: process.env.MOLLIE_TEST_WEBHOOK_URL || '/api/webhooks/mollie',
      organizationId: process.env.MOLLIE_TEST_ORG_ID || 'org_test_...',
    },
  },

  // Test data configurations
  testData: {
    // Valid test card numbers
    validCards: {
      visa: '4242424242424242',
      visaDebit: '4000056655665556',
      mastercard: '5555555555554444',
      amex: '378282246310005',
      declined: '4000000000000002',
      insufficientFunds: '4000000000009995',
      expired: '4000000000000069',
      fraudulent: '4100000000000019',
      requires3DS: '4000002500003155',
    },
    
    // Test amounts in cents (EUR)
    amounts: {
      small: 100, // €1.00
      normal: 10000, // €100.00
      large: 100000, // €1000.00
      gemeentebegrafenis: 150000, // €1500.00
      overLimit: 5000001, // €50000.01 (over max limit)
      underLimit: 99, // €0.99 (under min limit)
    },

    // Test customer data
    customers: {
      dutch: {
        id: 'cust_test_nl',
        email: 'test@example.nl',
        name: 'Jan de Vries',
        country: 'NL',
        postalCode: '1012 AB',
        city: 'Amsterdam',
      },
      belgian: {
        id: 'cust_test_be',
        email: 'test@example.be',
        name: 'Marie Dubois',
        country: 'BE',
        postalCode: '1000',
        city: 'Brussels',
      },
      german: {
        id: 'cust_test_de',
        email: 'test@example.de',
        name: 'Hans Mueller',
        country: 'DE',
        postalCode: '10115',
        city: 'Berlin',
      },
    },

    // Test provider data
    providers: {
      director: {
        id: 'provider_director_test',
        type: 'director',
        name: 'Test Funeral Director',
        company: 'Test Funeral Home BV',
        tier: 'gold',
        monthlyVolume: 50000,
      },
      venue: {
        id: 'provider_venue_test',
        type: 'venue',
        name: 'Test Crematorium',
        company: 'Test Venue BV',
        tier: 'silver',
        monthlyVolume: 25000,
      },
    },

    // Test service data
    services: {
      basicBurial: {
        id: 'service_basic_burial',
        type: 'basic_burial',
        name: 'Basic Burial Service',
        basePrice: 250000, // €2500.00
        gemeentebegraafnisEligible: true,
      },
      cremationBasic: {
        id: 'service_cremation_basic',
        type: 'cremation_basic',
        name: 'Basic Cremation Service',
        basePrice: 180000, // €1800.00
        gemeentebegraafnisEligible: true,
      },
      premiumBurial: {
        id: 'service_premium_burial',
        type: 'premium_burial',
        name: 'Premium Burial Service',
        basePrice: 500000, // €5000.00
        gemeentebegraafnisEligible: false,
      },
    },
  },

  // Test timeouts and delays
  timeouts: {
    paymentProcessing: 30000, // 30 seconds
    webhookProcessing: 5000, // 5 seconds
    refundProcessing: 10000, // 10 seconds
    disputeResolution: 60000, // 1 minute
  },

  // Mock configurations
  mocks: {
    enableNetworkMocks: true,
    mockPaymentProviders: true,
    mockWebhooks: true,
    mockDatabaseQueries: false,
    simulateLatency: false,
    latencyMs: 500,
  },

  // Security test configurations
  security: {
    maxTestAttempts: 3,
    testApiKeys: false, // Don't test with real API keys
    testProduction: false, // Never test against production
    validateCertificates: true,
    enforceHttps: true,
  },

  // Compliance test settings
  compliance: {
    pciDssLevel: 1,
    gdprCompliant: true,
    amlCompliant: true,
    testDataRetention: 30, // Days to retain test data
    anonymizeTestData: true,
  },

  // Test database configuration
  database: {
    url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db',
    schema: 'test_payments',
    resetBetweenTests: true,
    seedData: true,
  },

  // Logging configuration for tests
  logging: {
    level: 'debug',
    logToFile: true,
    logFile: './tests/payments/logs/test.log',
    logPaymentData: false, // Never log actual payment data
    logSecurityEvents: true,
  },

  // Performance test thresholds
  performance: {
    maxResponseTime: 2000, // 2 seconds
    maxDbQueryTime: 100, // 100ms
    maxPaymentProcessingTime: 10000, // 10 seconds
    maxConcurrentTransactions: 100,
  },

  // Feature flags for different test scenarios
  features: {
    testGemeentebegrafenis: true,
    testMarketplaceSplits: true,
    testMultiProvider: true,
    testHighValueTransactions: true,
    testFraudDetection: true,
    testDisputes: true,
    testRefunds: true,
    testRecurringPayments: false, // Not implemented yet
    testInternationalPayments: true,
  },
};

// Test helpers and utilities
export const TEST_HELPERS = {
  // Generate test payment intent
  createTestPaymentIntent: (overrides = {}) => ({
    amount: { amount: TEST_CONFIG.testData.amounts.normal, currency: 'EUR' },
    paymentType: 'regular_service',
    customerId: TEST_CONFIG.testData.customers.dutch.id,
    serviceId: TEST_CONFIG.testData.services.basicBurial.id,
    description: 'Test payment',
    metadata: { test: true },
    ...overrides,
  }),

  // Generate test webhook payload
  createTestWebhookPayload: (provider: 'stripe' | 'mollie', eventType: string, data: any) => {
    const timestamp = Math.floor(Date.now() / 1000);
    
    if (provider === 'stripe') {
      return {
        id: `evt_test_${Date.now()}`,
        object: 'event',
        api_version: '2024-06-20',
        created: timestamp,
        data: { object: data },
        livemode: false,
        pending_webhooks: 1,
        request: { id: null, idempotency_key: null },
        type: eventType,
      };
    } else {
      return {
        resource: 'payment',
        action: eventType,
        links: {
          self: { href: `https://api.mollie.com/v2/payments/${data.id}`, type: 'application/hal+json' },
        },
        id: data.id,
      };
    }
  },

  // Generate test card token
  createTestCardToken: (cardNumber = TEST_CONFIG.testData.validCards.visa) => ({
    id: `tok_test_${Date.now()}`,
    object: 'token',
    card: {
      id: `card_test_${Date.now()}`,
      brand: cardNumber.startsWith('4') ? 'visa' : 'mastercard',
      last4: cardNumber.slice(-4),
      exp_month: 12,
      exp_year: 2025,
      country: 'NL',
    },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    type: 'card',
    used: false,
  }),

  // Generate test gemeentebegrafenis documents
  createGemeentebegraafnisDocuments: () => [
    'income_statement',
    'municipal_approval',
    'death_certificate',
  ],

  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock payment provider responses
  mockStripeResponse: (method: string, response: any) => {
    return vi.fn().mockResolvedValue(response);
  },

  mockMollieResponse: (method: string, response: any) => {
    return vi.fn().mockResolvedValue(response);
  },

  // Cleanup test data
  cleanupTestData: async () => {
    // This would clean up any test data created during tests
    console.log('Cleaning up test data...');
  },
};

// Test assertions and matchers
export const TEST_ASSERTIONS = {
  // Validate payment intent structure
  expectValidPaymentIntent: (paymentIntent: any) => {
    expect(paymentIntent).toHaveProperty('id');
    expect(paymentIntent).toHaveProperty('amount');
    expect(paymentIntent).toHaveProperty('currency');
    expect(paymentIntent).toHaveProperty('status');
    expect(paymentIntent).toHaveProperty('provider');
    expect(paymentIntent.amount.currency).toBe('EUR');
  },

  // Validate marketplace split
  expectValidMarketplaceSplit: (split: any) => {
    expect(split).toHaveProperty('providerId');
    expect(split).toHaveProperty('providerAmount');
    expect(split).toHaveProperty('platformFee');
    expect(split).toHaveProperty('commissionFee');
    expect(split).toHaveProperty('netAmount');
    
    // Validate amounts are positive
    expect(split.providerAmount.amount).toBeGreaterThan(0);
    expect(split.platformFee.amount).toBeGreaterThan(0);
    expect(split.commissionFee.amount).toBeGreaterThan(0);
  },

  // Validate security compliance
  expectSecurePaymentData: (data: any) => {
    // Should not contain sensitive payment information
    expect(JSON.stringify(data)).not.toMatch(/4\d{3}\s?\d{4}\s?\d{4}\s?\d{4}/); // Card numbers
    expect(JSON.stringify(data)).not.toMatch(/\b\d{3,4}\b/); // CVV codes
    expect(data).not.toHaveProperty('cvv');
    expect(data).not.toHaveProperty('securityCode');
  },

  // Validate GDPR compliance
  expectGDPRCompliant: (dataProcessing: any) => {
    expect(dataProcessing).toHaveProperty('lawfulBasis');
    expect(dataProcessing).toHaveProperty('dataMinimization');
    expect(dataProcessing).toHaveProperty('retentionPeriod');
    expect(dataProcessing.dataMinimization).toBe(true);
  },

  // Validate PCI DSS compliance
  expectPCICompliant: (system: any) => {
    expect(system.encryption).toBe(true);
    expect(system.accessControl).toBeDefined();
    expect(system.monitoring).toBe(true);
    expect(system.testing).toBe('regular');
  },
};

export default TEST_CONFIG;