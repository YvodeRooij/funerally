/**
 * API Test Setup and Configuration
 * Comprehensive test utilities for Farewelly API testing
 */

import { NextRequest } from 'next/server'
import { createMocks } from 'node-mocks-http'
import { Session } from 'next-auth'
import { UserRole } from '@/types/next-auth'

// Test Database Configuration
export const TEST_DB_CONFIG = {
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/farewelly_test',
  schema: 'test_schema',
  resetBeforeEach: true,
}

// Mock Session Factory
export const createMockSession = (
  userType: UserRole = 'family',
  overrides: Partial<Session['user']> = {}
): Session => ({
  user: {
    id: `test-${userType}-${Date.now()}`,
    email: `test-${userType}@example.com`,
    name: `Test ${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
    userType,
    role: userType,
    permissions: getDefaultPermissions(userType),
    ...overrides,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
})

// Default Permissions by Role
export const getDefaultPermissions = (role: UserRole): string[] => {
  const permissions = {
    family: [
      'bookings:create',
      'bookings:read:own',
      'bookings:update:own',
      'documents:upload',
      'documents:read:own',
      'chat:send',
      'chat:read:own',
    ],
    director: [
      'bookings:read:all',
      'bookings:update:assigned',
      'clients:create',
      'clients:read:own',
      'clients:update:own',
      'calendar:manage',
      'analytics:read:own',
      'documents:read:shared',
    ],
    venue: [
      'bookings:read:venue',
      'bookings:update:venue',
      'availability:manage',
      'analytics:read:own',
      'calendar:manage',
    ],
    admin: [
      'users:manage',
      'bookings:read:all',
      'bookings:update:all',
      'analytics:read:all',
      'system:manage',
    ],
  }
  return permissions[role] || []
}

// Mock Request Factory
export const createMockRequest = (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: any,
  headers?: Record<string, string>,
  query?: Record<string, string>
) => {
  const { req } = createMocks({
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    query,
  })
  
  return req as NextRequest
}

// Test Data Factories
export const createTestFamily = (overrides: any = {}) => ({
  id: `family-${Date.now()}`,
  email: `family-${Date.now()}@test.com`,
  name: 'Test Family',
  phone: '+31612345678',
  address: 'Test Street 123, Amsterdam',
  user_type: 'family' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestDirector = (overrides: any = {}) => ({
  id: `director-${Date.now()}`,
  email: `director-${Date.now()}@test.com`,
  name: 'Test Director',
  phone: '+31687654321',
  company: 'Test Funeral Home',
  address: 'Director Street 456, Utrecht',
  user_type: 'director' as const,
  specializations: ['traditional', 'cremation'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestVenue = (overrides: any = {}) => ({
  id: `venue-${Date.now()}`,
  email: `venue-${Date.now()}@test.com`,
  name: 'Test Venue',
  company: 'Test Ceremony Hall',
  address: 'Venue Street 789, Rotterdam',
  phone: '+31698765432',
  user_type: 'venue' as const,
  capacity: 100,
  facilities: ['parking', 'wheelchair_accessible', 'catering'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestBooking = (familyId?: string, directorId?: string, venueId?: string) => ({
  id: `booking-${Date.now()}`,
  family_id: familyId || createTestFamily().id,
  director_id: directorId,
  venue_id: venueId,
  service_type: 'traditional',
  date: '2024-12-31',
  time: '14:00',
  duration: 120,
  status: 'pending' as const,
  price: 2500,
  notes: 'Test booking notes',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

export const createTestDocument = (ownerId: string, ownerType: 'family' | 'director' | 'venue') => ({
  id: `doc-${Date.now()}`,
  title: 'Test Document',
  type: 'certificate',
  file_path: '/test/documents/test.pdf',
  file_size: 1024000,
  mime_type: 'application/pdf',
  owner_id: ownerId,
  owner_type: ownerType,
  is_encrypted: false,
  shared_with: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

export const createTestPayment = (bookingId: string) => ({
  id: `payment-${Date.now()}`,
  booking_id: bookingId,
  amount: 2500,
  currency: 'EUR',
  status: 'pending' as const,
  payment_method: 'stripe',
  splits: [],
  refunds: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

// Test Database Helpers
export const cleanupTestData = async () => {
  // Implementation would clean up test database
  // This is a placeholder for actual cleanup logic
  console.log('Cleaning up test data...')
}

export const seedTestData = async () => {
  // Implementation would seed test database with initial data
  // This is a placeholder for actual seeding logic
  console.log('Seeding test data...')
}

// Mock External Services
export const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  execute: jest.fn().mockResolvedValue({ data: [], error: null }),
}

export const mockAuthSession = (session: Session | null = null) => {
  jest.mock('next-auth', () => ({
    getServerSession: jest.fn().mockResolvedValue(session),
  }))
}

// Performance Testing Helpers
export const measureResponseTime = async (apiCall: () => Promise<any>) => {
  const start = performance.now()
  await apiCall()
  const end = performance.now()
  return end - start
}

export const runConcurrentTests = async (apiCall: () => Promise<any>, concurrency: number = 10) => {
  const promises = Array(concurrency).fill(null).map(() => apiCall())
  const results = await Promise.allSettled(promises)
  
  return {
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    results,
  }
}

// Security Testing Helpers
export const createMaliciousPayload = (type: 'sql_injection' | 'xss' | 'buffer_overflow') => {
  const payloads = {
    sql_injection: "'; DROP TABLE users; --",
    xss: '<script>alert("XSS")</script>',
    buffer_overflow: 'A'.repeat(10000),
  }
  return payloads[type]
}

export const testRateLimiting = async (
  apiCall: () => Promise<any>,
  requestCount: number = 100,
  timeWindow: number = 60000 // 1 minute
) => {
  const start = Date.now()
  const promises = Array(requestCount).fill(null).map(apiCall)
  const results = await Promise.allSettled(promises)
  const duration = Date.now() - start
  
  return {
    requestCount,
    timeWindow: duration,
    successful: results.filter(r => r.status === 'fulfilled').length,
    rateLimited: results.filter(r => 
      r.status === 'rejected' && 
      (r.reason?.status === 429 || r.reason?.message?.includes('rate limit'))
    ).length,
  }
}

// Test Validation Helpers
export const validateApiResponse = (response: any, expectedSchema: any) => {
  // Implementation would validate response against schema
  // This is a placeholder for actual validation logic
  return {
    valid: true,
    errors: [],
  }
}

export const validateErrorResponse = (response: any, expectedStatus: number, expectedMessage?: string) => {
  const isValid = response.status === expectedStatus &&
    (!expectedMessage || response.body?.error === expectedMessage)
  
  return {
    valid: isValid,
    actualStatus: response.status,
    actualMessage: response.body?.error,
    expectedStatus,
    expectedMessage,
  }
}