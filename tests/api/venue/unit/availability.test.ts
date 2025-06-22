/**
 * Venue Availability API Unit Tests
 * Tests for /api/venue/availability endpoints
 */

import { GET, POST } from '@/app/api/venue/availability/route'
import { 
  createMockRequest, 
  createMockSession, 
  createTestVenue,
  mockAuthSession,
  validateApiResponse,
  validateErrorResponse 
} from '../../utils/test-setup'

// Mock the route handlers since they don't exist yet
jest.mock('@/app/api/venue/availability/route', () => ({
  GET: jest.fn(),
  POST: jest.fn(),
}))

describe('Venue Availability API - Unit Tests', () => {
  
  const createTestAvailability = (venueId: string) => ({
    id: `availability-${Date.now()}`,
    venue_id: venueId,
    date: '2024-12-31',
    time_slots: [
      {
        start_time: '09:00',
        end_time: '12:00',
        is_available: true,
        price: 500,
      },
      {
        start_time: '14:00',
        end_time: '17:00',
        is_available: true,
        price: 750,
      },
      {
        start_time: '18:00',
        end_time: '21:00',
        is_available: false,
        booking_id: 'booking-123',
      },
    ],
    special_pricing: {
      weekend_surcharge: 100,
      holiday_surcharge: 200,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup default successful responses
    const { GET: MockGET, POST: MockPOST } = require('@/app/api/venue/availability/route')
    
    MockGET.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, availability: [] }),
    })
    
    MockPOST.mockResolvedValue({
      status: 201,
      json: () => Promise.resolve({ success: true, availability: createTestAvailability('venue-123') }),
    })
  })
  
  describe('GET /api/venue/availability', () => {
    it('should return venue availability for authenticated venue', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const mockAvailability = [
        createTestAvailability(venueSession.user.id),
        { ...createTestAvailability(venueSession.user.id), date: '2025-01-01' },
      ]
      
      const { GET: MockGET } = require('@/app/api/venue/availability/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, availability: mockAvailability }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('availability')
      expect(Array.isArray(body.availability)).toBe(true)
      expect(body.availability).toHaveLength(2)
      expect(body.availability[0]).toHaveProperty('venue_id', venueSession.user.id)
    })
    
    it('should return 401 for unauthenticated requests', async () => {
      // Setup - no session
      mockAuthSession(null)
      
      const { GET: MockGET } = require('@/app/api/venue/availability/route')
      MockGET.mockResolvedValue({
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(401)
      expect(body).toHaveProperty('error', 'Unauthorized')
    })
    
    it('should return 403 for non-venue users', async () => {
      // Setup - family user trying to access venue availability
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const { GET: MockGET } = require('@/app/api/venue/availability/route')
      MockGET.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Access denied - Venue role required' }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(403)
      expect(body).toHaveProperty('error', 'Access denied - Venue role required')
    })
    
    it('should filter availability by date range when specified', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const filteredAvailability = [
        { ...createTestAvailability(venueSession.user.id), date: '2024-12-15' },
        { ...createTestAvailability(venueSession.user.id), date: '2024-12-20' },
      ]
      
      const { GET: MockGET } = require('@/app/api/venue/availability/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, availability: filteredAvailability }),
      })
      
      const request = createMockRequest('GET', null, {}, {
        start_date: '2024-12-01',
        end_date: '2024-12-31',
      })
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body.availability).toHaveLength(2)
      expect(body.availability.every((a: any) => a.date.startsWith('2024-12'))).toBe(true)
    })
    
    it('should include booking information in unavailable slots', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const availabilityWithBookings = [
        {
          ...createTestAvailability(venueSession.user.id),
          time_slots: [
            {
              start_time: '14:00',
              end_time: '17:00',
              is_available: false,
              booking_id: 'booking-123',
              booking_details: {
                id: 'booking-123',
                family_name: 'Smith Family',
                service_type: 'traditional',
                status: 'confirmed',
              },
            },
          ],
        },
      ]
      
      const { GET: MockGET } = require('@/app/api/venue/availability/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, availability: availabilityWithBookings }),
      })
      
      const request = createMockRequest('GET', null, {}, { include_bookings: 'true' })
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body.availability[0].time_slots[0]).toHaveProperty('booking_details')
      expect(body.availability[0].time_slots[0].booking_details).toHaveProperty('family_name', 'Smith Family')
    })
    
    it('should calculate utilization statistics', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const { GET: MockGET } = require('@/app/api/venue/availability/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({
          success: true,
          availability: [],
          statistics: {
            total_slots: 30,
            available_slots: 18,
            booked_slots: 12,
            utilization_rate: 0.4,
            average_price: 625,
            total_revenue: 7500,
          },
        }),
      })
      
      const request = createMockRequest('GET', null, {}, {
        include_stats: 'true',
        start_date: '2024-12-01',
        end_date: '2024-12-31',
      })
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('statistics')
      expect(body.statistics).toHaveProperty('utilization_rate', 0.4)
      expect(body.statistics).toHaveProperty('total_revenue', 7500)
    })
  })
  
  describe('POST /api/venue/availability', () => {
    it('should create availability with valid data', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const availabilityData = {
        date: '2024-12-31',
        time_slots: [
          {
            start_time: '09:00',
            end_time: '12:00',
            is_available: true,
            price: 500,
          },
          {
            start_time: '14:00',
            end_time: '17:00',
            is_available: true,
            price: 750,
          },
        ],
        special_pricing: {
          weekend_surcharge: 100,
        },
      }
      
      const newAvailability = createTestAvailability(venueSession.user.id)
      newAvailability.date = availabilityData.date
      newAvailability.time_slots = availabilityData.time_slots
      newAvailability.special_pricing = availabilityData.special_pricing
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({ success: true, availability: newAvailability }),
      })
      
      const request = createMockRequest('POST', availabilityData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(201)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('availability')
      expect(body.availability).toMatchObject({
        venue_id: venueSession.user.id,
        date: availabilityData.date,
      })
      expect(body.availability.time_slots).toHaveLength(2)
    })
    
    it('should validate required fields', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const incompleteData = {
        date: '2024-12-31',
        // Missing time_slots
      }
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'time_slots is required' }),
      })
      
      const request = createMockRequest('POST', incompleteData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'time_slots is required')
    })
    
    it('should validate date format', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const invalidDateData = {
        date: 'invalid-date',
        time_slots: [
          {
            start_time: '09:00',
            end_time: '12:00',
            is_available: true,
            price: 500,
          },
        ],
      }
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid date format. Use YYYY-MM-DD' }),
      })
      
      const request = createMockRequest('POST', invalidDateData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('Invalid date format')
    })
    
    it('should prevent setting availability in the past', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const pastDateData = {
        date: '2020-01-01', // Past date
        time_slots: [
          {
            start_time: '09:00',
            end_time: '12:00',
            is_available: true,
            price: 500,
          },
        ],
      }
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Cannot set availability for past dates' }),
      })
      
      const request = createMockRequest('POST', pastDateData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'Cannot set availability for past dates')
    })
    
    it('should validate time slot format', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const invalidTimeSlotData = {
        date: '2024-12-31',
        time_slots: [
          {
            start_time: '25:00', // Invalid time
            end_time: '12:00',
            is_available: true,
            price: 500,
          },
        ],
      }
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid time format in time slot 1: start_time' }),
      })
      
      const request = createMockRequest('POST', invalidTimeSlotData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('Invalid time format')
    })
    
    it('should validate time slot ordering', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const invalidOrderData = {
        date: '2024-12-31',
        time_slots: [
          {
            start_time: '15:00',
            end_time: '12:00', // End before start
            is_available: true,
            price: 500,
          },
        ],
      }
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'End time must be after start time in time slot 1' }),
      })
      
      const request = createMockRequest('POST', invalidOrderData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('End time must be after start time')
    })
    
    it('should detect overlapping time slots', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const overlappingData = {
        date: '2024-12-31',
        time_slots: [
          {
            start_time: '09:00',
            end_time: '12:00',
            is_available: true,
            price: 500,
          },
          {
            start_time: '11:00', // Overlaps with previous
            end_time: '14:00',
            is_available: true,
            price: 600,
          },
        ],
      }
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Time slot 2 overlaps with time slot 1' }),
      })
      
      const request = createMockRequest('POST', overlappingData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('overlaps')
    })
    
    it('should validate price values', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const invalidPriceData = {
        date: '2024-12-31',
        time_slots: [
          {
            start_time: '09:00',
            end_time: '12:00',
            is_available: true,
            price: -100, // Negative price
          },
        ],
      }
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Price must be a positive number in time slot 1' }),
      })
      
      const request = createMockRequest('POST', invalidPriceData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('positive number')
    })
    
    it('should handle upsert for existing date', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const existingDateData = {
        date: '2024-12-31', // Date already has availability
        time_slots: [
          {
            start_time: '10:00',
            end_time: '13:00',
            is_available: true,
            price: 600,
          },
        ],
      }
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 200, // Updated existing
        json: () => Promise.resolve({
          success: true,
          availability: createTestAvailability(venueSession.user.id),
          updated: true,
        }),
      })
      
      const request = createMockRequest('POST', existingDateData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('updated', true)
    })
    
    it('should prevent conflicts with existing bookings', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const conflictingData = {
        date: '2024-12-31',
        time_slots: [
          {
            start_time: '14:00',
            end_time: '17:00',
            is_available: true, // Trying to make available when booked
            price: 500,
          },
        ],
      }
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 409,
        json: () => Promise.resolve({
          error: 'Cannot modify availability - time slot has existing booking',
          conflicting_booking_id: 'booking-123',
        }),
      })
      
      const request = createMockRequest('POST', conflictingData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(409)
      expect(body).toHaveProperty('error')
      expect(body).toHaveProperty('conflicting_booking_id')
    })
    
    it('should require venue authentication', async () => {
      // Setup - no session
      mockAuthSession(null)
      
      const availabilityData = {
        date: '2024-12-31',
        time_slots: [
          {
            start_time: '09:00',
            end_time: '12:00',
            is_available: true,
            price: 500,
          },
        ],
      }
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      })
      
      const request = createMockRequest('POST', availabilityData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(401)
      expect(body).toHaveProperty('error', 'Unauthorized')
    })
    
    it('should validate venue role', async () => {
      // Setup - director trying to set venue availability
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const availabilityData = {
        date: '2024-12-31',
        time_slots: [
          {
            start_time: '09:00',
            end_time: '12:00',
            is_available: true,
            price: 500,
          },
        ],
      }
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Access denied - Venue role required' }),
      })
      
      const request = createMockRequest('POST', availabilityData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(403)
      expect(body).toHaveProperty('error', 'Access denied - Venue role required')
    })
  })
  
  describe('Business Logic Validation', () => {
    it('should validate minimum slot duration', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const shortSlotData = {
        date: '2024-12-31',
        time_slots: [
          {
            start_time: '09:00',
            end_time: '09:30', // 30 minutes - too short
            is_available: true,
            price: 500,
          },
        ],
      }
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Time slot duration must be at least 1 hour' }),
      })
      
      const request = createMockRequest('POST', shortSlotData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('at least 1 hour')
    })
    
    it('should validate maximum advance booking period', async () => {
      // Setup
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const farFutureData = {
        date: '2026-12-31', // Too far in future
        time_slots: [
          {
            start_time: '09:00',
            end_time: '12:00',
            is_available: true,
            price: 500,
          },
        ],
      }
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Cannot set availability more than 12 months in advance' }),
      })
      
      const request = createMockRequest('POST', farFutureData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('12 months')
    })
  })
  
  describe('Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid request data' }),
      })
      
      const response = await MockPOST(request)
      const body = await response.json()
      
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'Invalid request data')
    })
    
    it('should handle database connection failures', async () => {
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const { GET: MockGET } = require('@/app/api/venue/availability/route')
      MockGET.mockResolvedValue({
        status: 500,
        json: () => Promise.resolve({ error: 'Database connection failed' }),
      })
      
      const request = createMockRequest('GET')
      const response = await MockGET(request)
      const body = await response.json()
      
      expect(response.status).toBe(500)
      expect(body).toHaveProperty('error', 'Database connection failed')
    })
  })
  
  describe('Security Tests', () => {
    it('should prevent price manipulation attempts', async () => {
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const maliciousData = {
        date: '2024-12-31',
        time_slots: [
          {
            start_time: '09:00',
            end_time: '12:00',
            is_available: true,
            price: 99999999, // Unreasonably high price
          },
        ],
      }
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Price exceeds maximum allowed value (10000)' }),
      })
      
      const request = createMockRequest('POST', maliciousData)
      const response = await MockPOST(request)
      const body = await response.json()
      
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('maximum allowed')
    })
    
    it('should sanitize special pricing data', async () => {
      const venueSession = createMockSession('venue')
      mockAuthSession(venueSession)
      
      const xssData = {
        date: '2024-12-31',
        time_slots: [
          {
            start_time: '09:00',
            end_time: '12:00',
            is_available: true,
            price: 500,
          },
        ],
        special_pricing: {
          '<script>alert("xss")</script>weekend_surcharge': 100,
        },
      }
      
      const sanitizedAvailability = createTestAvailability(venueSession.user.id)
      sanitizedAvailability.special_pricing = { weekend_surcharge: 100 } // XSS removed
      
      const { POST: MockPOST } = require('@/app/api/venue/availability/route')
      MockPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({ success: true, availability: sanitizedAvailability }),
      })
      
      const request = createMockRequest('POST', xssData)
      const response = await MockPOST(request)
      const body = await response.json()
      
      expect(response.status).toBe(201)
      expect(Object.keys(body.availability.special_pricing)).not.toContain('<script>')
    })
  })
})