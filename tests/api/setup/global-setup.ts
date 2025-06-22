/**
 * Global Test Setup
 * Runs before each test file
 */

import { jest } from '@jest/globals'
import { 
  cleanupTestData, 
  seedTestData, 
  mockSupabaseClient,
  mockAuthSession,
  createMockSession
} from '../utils/test-setup'

// Global test setup
beforeAll(async () => {
  // Clean up any existing test data
  await cleanupTestData()
  
  // Seed fresh test data
  await seedTestData()
  
  // Set up global mocks
  setupGlobalMocks()
  
  // Configure test timeouts
  jest.setTimeout(30000)
})

afterAll(async () => {
  // Clean up after all tests
  await cleanupTestData()
  
  // Reset all mocks
  jest.resetAllMocks()
  jest.restoreAllMocks()
})

beforeEach(async () => {
  // Reset mocks before each test
  jest.clearAllMocks()
  
  // Set up fresh mock session (can be overridden in individual tests)
  mockAuthSession(createMockSession('family'))
})

afterEach(async () => {
  // Clean up after each test
  jest.clearAllMocks()
})

function setupGlobalMocks() {
  // Mock Next.js modules
  jest.mock('next/server', () => ({
    NextRequest: jest.fn(),
    NextResponse: {
      json: jest.fn((data, init) => ({
        status: init?.status || 200,
        headers: new Map(),
        body: data,
        json: () => Promise.resolve(data),
      })),
    },
  }))
  
  // Mock NextAuth
  jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
  }))
  
  // Mock Supabase client
  jest.mock('@/lib/supabase', () => ({
    createClient: jest.fn(() => mockSupabaseClient),
    supabase: mockSupabaseClient,
  }))
  
  // Mock file system operations
  jest.mock('fs/promises', () => ({
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(Buffer.from('mock file content')),
    unlink: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
  }))
  
  // Mock external APIs
  jest.mock('stripe', () => ({
    __esModule: true,
    default: jest.fn(() => ({
      paymentIntents: {
        create: jest.fn().mockResolvedValue({
          id: 'pi_mock_payment_intent',
          client_secret: 'pi_mock_payment_intent_secret',
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'pi_mock_payment_intent',
          status: 'succeeded',
        }),
      },
      refunds: {
        create: jest.fn().mockResolvedValue({
          id: 're_mock_refund',
          status: 'succeeded',
        }),
      },
    })),
  }))
  
  // Mock Mollie
  jest.mock('@mollie/api-client', () => ({
    createMollieClient: jest.fn(() => ({
      payments: {
        create: jest.fn().mockResolvedValue({
          id: 'tr_mock_payment',
          _links: {
            checkout: {
              href: 'https://checkout.mollie.com/mock',
            },
          },
        }),
        get: jest.fn().mockResolvedValue({
          id: 'tr_mock_payment',
          status: 'paid',
        }),
      },
      refunds: {
        create: jest.fn().mockResolvedValue({
          id: 're_mock_refund',
          status: 'refunded',
        }),
      },
    })),
  }))
  
  // Mock Gemini AI
  jest.mock('@google-ai/generativelanguage', () => ({
    GoogleGenerativeAI: jest.fn(() => ({
      getGenerativeModel: jest.fn(() => ({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: jest.fn().mockReturnValue(JSON.stringify({
              companyName: "Mock Company B.V.",
              kvkNumber: "12345678",
              address: "Mock Street 123",
              postalCode: "1234 AB",
              city: "Amsterdam",
              phone: "020-1234567",
              email: "info@mockcompany.nl",
              confidence: {
                companyName: 0.95,
                kvkNumber: 0.98,
                address: 0.90,
              },
            })),
          },
        })),
      })),
    })),
  }))
  
  // Mock Pusher for real-time features
  jest.mock('pusher', () => ({
    __esModule: true,
    default: jest.fn(() => ({
      trigger: jest.fn().mockResolvedValue({}),
      authenticate: jest.fn().mockReturnValue({
        auth: 'mock_auth_signature',
      }),
    })),
  }))
  
  // Mock email service
  jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'mock_message_id',
        accepted: ['test@example.com'],
        rejected: [],
      }),
    })),
  }))
  
  // Mock SMS service
  jest.mock('twilio', () => ({
    __esModule: true,
    default: jest.fn(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          sid: 'mock_sms_sid',
          status: 'sent',
        }),
      },
    })),
  }))
  
  // Mock crypto for encryption
  jest.mock('crypto', () => ({
    ...jest.requireActual('crypto'),
    randomBytes: jest.fn(() => Buffer.from('mock_random_bytes')),
    createHash: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn(() => 'mock_hash'),
    })),
    createCipher: jest.fn(() => ({
      update: jest.fn().mockReturnValue('mock_encrypted'),
      final: jest.fn().mockReturnValue('_data'),
    })),
    createDecipher: jest.fn(() => ({
      update: jest.fn().mockReturnValue('mock_decrypted'),
      final: jest.fn().mockReturnValue('_data'),
    })),
  }))
  
  // Mock console to reduce noise in tests
  const originalConsole = console
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})