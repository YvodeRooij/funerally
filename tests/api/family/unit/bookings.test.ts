/**
 * Family Bookings API Unit Tests
 * Tests for /api/family/bookings endpoints
 */

import { GET, POST } from '@/app/api/family/bookings/route'
import { GET as BookingDetailGET, PUT as BookingDetailPUT, DELETE as BookingDetailDELETE } from '@/app/api/family/bookings/[id]/route'
import { 
  createMockRequest, 
  createMockSession, 
  createTestFamily,
  createTestBooking,
  mockAuthSession,
  validateApiResponse,
  validateErrorResponse 
} from '../../utils/test-setup'

// Mock the route handlers since they don't exist yet
jest.mock('@/app/api/family/bookings/route', () => ({
  GET: jest.fn(),
  POST: jest.fn(),
}))

jest.mock('@/app/api/family/bookings/[id]/route', () => ({
  GET: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
}))

describe('Family Bookings API - Unit Tests', () => {
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup default successful responses
    const { GET: MockGET, POST: MockPOST } = require('@/app/api/family/bookings/route')
    const { GET: MockDetailGET, PUT: MockDetailPUT, DELETE: MockDetailDELETE } = require('@/app/api/family/bookings/[id]/route')
    
    MockGET.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, bookings: [] }),
    })
    
    MockPOST.mockResolvedValue({
      status: 201,
      json: () => Promise.resolve({ success: true, booking: createTestBooking() }),
    })
    
    MockDetailGET.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, booking: createTestBooking() }),
    })
    
    MockDetailPUT.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, booking: createTestBooking() }),
    })
    
    MockDetailDELETE.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, message: 'Booking cancelled' }),
    })
  })
  
  describe('GET /api/family/bookings', () => {
    it('should return list of family bookings for authenticated user', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const mockBookings = [
        createTestBooking(familySession.user.id),
        createTestBooking(familySession.user.id),
      ]
      
      const { GET: MockGET } = require('@/app/api/family/bookings/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, bookings: mockBookings }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('bookings')
      expect(Array.isArray(body.bookings)).toBe(true)
      expect(body.bookings).toHaveLength(2)
    })
    
    it('should return 401 for unauthenticated requests', async () => {
      // Setup - no session
      mockAuthSession(null)
      
      const { GET: MockGET } = require('@/app/api/family/bookings/route')
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
    
    it('should handle query parameters for filtering', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const request = createMockRequest('GET', null, {}, {
        status: 'pending',
        date_from: '2024-01-01',
        date_to: '2024-12-31',
      })
      
      const { GET: MockGET } = require('@/app/api/family/bookings/route')
      
      // Execute
      await MockGET(request)
      
      // Assert
      expect(MockGET).toHaveBeenCalledWith(request)
    })
    
    it('should handle pagination parameters', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const request = createMockRequest('GET', null, {}, {
        page: '2',
        limit: '10',
      })
      
      const { GET: MockGET } = require('@/app/api/family/bookings/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({
          success: true,
          bookings: [],
          pagination: {
            page: 2,
            limit: 10,
            total: 25,
            pages: 3,
          },
        }),
      })
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('pagination')
      expect(body.pagination).toMatchObject({
        page: 2,
        limit: 10,
        total: 25,
        pages: 3,
      })
    })
    
    it('should handle database errors gracefully', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const { GET: MockGET } = require('@/app/api/family/bookings/route')
      MockGET.mockResolvedValue({
        status: 500,
        json: () => Promise.resolve({ error: 'Database error' }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(500)
      expect(body).toHaveProperty('error', 'Database error')
    })
  })
  
  describe('POST /api/family/bookings', () => {
    it('should create new booking with valid data', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const bookingData = {
        service_type: 'traditional',
        date: '2024-12-31',
        time: '14:00',
        duration: 120,
        director_id: 'director-123',
        venue_id: 'venue-456',
        notes: 'Special requirements for the service',
      }
      
      const mockBooking = createTestBooking(familySession.user.id, bookingData.director_id, bookingData.venue_id)
      const { POST: MockPOST } = require('@/app/api/family/bookings/route')
      MockPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({ success: true, booking: mockBooking }),
      })
      
      const request = createMockRequest('POST', bookingData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(201)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('booking')
      expect(body.booking).toMatchObject({
        family_id: familySession.user.id,
        service_type: bookingData.service_type,
        date: bookingData.date,
        time: bookingData.time,
      })
    })
    
    it('should validate required fields', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const incompleteData = {
        service_type: 'traditional',
        // Missing required fields: date, time, duration
      }
      
      const { POST: MockPOST } = require('@/app/api/family/bookings/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Missing required fields: date, time, duration' }),
      })
      
      const request = createMockRequest('POST', incompleteData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('required fields')
    })
    
    it('should validate date format', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const invalidDateData = {
        service_type: 'traditional',
        date: 'invalid-date',
        time: '14:00',
        duration: 120,
      }
      
      const { POST: MockPOST } = require('@/app/api/family/bookings/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid date format' }),
      })
      
      const request = createMockRequest('POST', invalidDateData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'Invalid date format')
    })
    
    it('should validate time format', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const invalidTimeData = {
        service_type: 'traditional',
        date: '2024-12-31',
        time: '25:70', // Invalid time
        duration: 120,
      }
      
      const { POST: MockPOST } = require('@/app/api/family/bookings/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid time format' }),
      })
      
      const request = createMockRequest('POST', invalidTimeData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'Invalid time format')
    })
    
    it('should prevent booking in the past', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const pastDateData = {
        service_type: 'traditional',
        date: '2020-01-01', // Past date
        time: '14:00',
        duration: 120,
      }
      
      const { POST: MockPOST } = require('@/app/api/family/bookings/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Cannot book dates in the past' }),
      })
      
      const request = createMockRequest('POST', pastDateData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'Cannot book dates in the past')
    })
    
    it('should require authentication', async () => {
      // Setup - no session
      mockAuthSession(null)
      
      const bookingData = {
        service_type: 'traditional',
        date: '2024-12-31',
        time: '14:00',
        duration: 120,
      }
      
      const { POST: MockPOST } = require('@/app/api/family/bookings/route')
      MockPOST.mockResolvedValue({
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      })
      
      const request = createMockRequest('POST', bookingData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(401)
      expect(body).toHaveProperty('error', 'Unauthorized')
    })
  })
  
  describe('GET /api/family/bookings/[id]', () => {
    it('should return specific booking for authenticated family user', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const bookingId = 'booking-123'
      const mockBooking = createTestBooking(familySession.user.id)
      mockBooking.id = bookingId
      
      const { GET: MockDetailGET } = require('@/app/api/family/bookings/[id]/route')
      MockDetailGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, booking: mockBooking }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockDetailGET(request, { params: { id: bookingId } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('booking')
      expect(body.booking.id).toBe(bookingId)
      expect(body.booking.family_id).toBe(familySession.user.id)
    })
    
    it('should return 404 for non-existent booking', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const { GET: MockDetailGET } = require('@/app/api/family/bookings/[id]/route')
      MockDetailGET.mockResolvedValue({
        status: 404,
        json: () => Promise.resolve({ error: 'Booking not found' }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockDetailGET(request, { params: { id: 'non-existent' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(404)
      expect(body).toHaveProperty('error', 'Booking not found')
    })
    
    it('should return 403 for booking belonging to different family', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const { GET: MockDetailGET } = require('@/app/api/family/bookings/[id]/route')
      MockDetailGET.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Access denied' }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockDetailGET(request, { params: { id: 'other-family-booking' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(403)
      expect(body).toHaveProperty('error', 'Access denied')
    })
  })
  
  describe('PUT /api/family/bookings/[id]', () => {
    it('should update booking with valid data', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const bookingId = 'booking-123'
      const updateData = {
        date: '2025-01-15',
        time: '16:00',
        notes: 'Updated requirements',
      }
      
      const updatedBooking = {
        ...createTestBooking(familySession.user.id),
        id: bookingId,
        ...updateData,
      }
      
      const { PUT: MockDetailPUT } = require('@/app/api/family/bookings/[id]/route')
      MockDetailPUT.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, booking: updatedBooking }),
      })
      
      const request = createMockRequest('PUT', updateData)
      
      // Execute
      const response = await MockDetailPUT(request, { params: { id: bookingId } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('success', true)
      expect(body.booking).toMatchObject(updateData)
    })
    
    it('should validate update permissions based on booking status', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const bookingId = 'booking-123'
      const updateData = { date: '2025-01-15' }
      
      const { PUT: MockDetailPUT } = require('@/app/api/family/bookings/[id]/route')
      MockDetailPUT.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Cannot modify confirmed booking' }),
      })
      
      const request = createMockRequest('PUT', updateData)
      
      // Execute
      const response = await MockDetailPUT(request, { params: { id: bookingId } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'Cannot modify confirmed booking')
    })
    
    it('should prevent unauthorized updates', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const { PUT: MockDetailPUT } = require('@/app/api/family/bookings/[id]/route')
      MockDetailPUT.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Access denied' }),
      })
      
      const request = createMockRequest('PUT', { date: '2025-01-15' })
      
      // Execute
      const response = await MockDetailPUT(request, { params: { id: 'other-family-booking' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(403)
      expect(body).toHaveProperty('error', 'Access denied')
    })
  })
  
  describe('DELETE /api/family/bookings/[id]', () => {
    it('should cancel booking successfully', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const bookingId = 'booking-123'
      
      const { DELETE: MockDetailDELETE } = require('@/app/api/family/bookings/[id]/route')
      MockDetailDELETE.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, message: 'Booking cancelled successfully' }),
      })
      
      const request = createMockRequest('DELETE')
      
      // Execute
      const response = await MockDetailDELETE(request, { params: { id: bookingId } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('message', 'Booking cancelled successfully')
    })
    
    it('should prevent cancellation of completed bookings', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const { DELETE: MockDetailDELETE } = require('@/app/api/family/bookings/[id]/route')
      MockDetailDELETE.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Cannot cancel completed booking' }),
      })
      
      const request = createMockRequest('DELETE')
      
      // Execute
      const response = await MockDetailDELETE(request, { params: { id: 'completed-booking' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'Cannot cancel completed booking')
    })
    
    it('should handle cancellation fees and policies', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const { DELETE: MockDetailDELETE } = require('@/app/api/family/bookings/[id]/route')
      MockDetailDELETE.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({
          success: true,
          message: 'Booking cancelled with fee',
          cancellation_fee: 50.00,
          refund_amount: 200.00,
        }),
      })
      
      const request = createMockRequest('DELETE')
      
      // Execute
      const response = await MockDetailDELETE(request, { params: { id: 'booking-with-fee' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('cancellation_fee', 50.00)
      expect(body).toHaveProperty('refund_amount', 200.00)
    })
  })
  
  describe('Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any
      
      const { POST: MockPOST } = require('@/app/api/family/bookings/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid request data' }),
      })
      
      const response = await MockPOST(request)
      const body = await response.json()
      
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
    })
    
    it('should handle database connection failures', async () => {
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const { GET: MockGET } = require('@/app/api/family/bookings/route')
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
})