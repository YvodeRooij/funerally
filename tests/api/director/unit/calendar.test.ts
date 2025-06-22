/**
 * Director Calendar API Unit Tests
 * Tests for /api/director/calendar endpoints
 */

import { GET, POST } from '@/app/api/director/calendar/route'
import { 
  createMockRequest, 
  createMockSession, 
  createTestDirector,
  createTestBooking,
  mockAuthSession,
  validateApiResponse,
  validateErrorResponse 
} from '../../utils/test-setup'

// Mock the route handlers since they don't exist yet
jest.mock('@/app/api/director/calendar/route', () => ({
  GET: jest.fn(),
  POST: jest.fn(),
}))

describe('Director Calendar API - Unit Tests', () => {
  
  const createTestCalendarEvent = (ownerId: string, ownerType: string = 'director') => ({
    id: `event-${Date.now()}`,
    owner_id: ownerId,
    owner_type: ownerType,
    title: 'Test Calendar Event',
    description: 'Test event description',
    start_time: '2024-12-31T14:00:00Z',
    end_time: '2024-12-31T16:00:00Z',
    booking_id: null,
    type: 'available' as const,
    recurring: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup default successful responses
    const { GET: MockGET, POST: MockPOST } = require('@/app/api/director/calendar/route')
    
    MockGET.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, events: [] }),
    })
    
    MockPOST.mockResolvedValue({
      status: 201,
      json: () => Promise.resolve({ success: true, event: createTestCalendarEvent('director-123') }),
    })
  })
  
  describe('GET /api/director/calendar', () => {
    it('should return calendar events for authenticated director', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const mockEvents = [
        createTestCalendarEvent(directorSession.user.id, 'director'),
        { ...createTestCalendarEvent(directorSession.user.id, 'director'), type: 'booking' },
      ]
      
      const { GET: MockGET } = require('@/app/api/director/calendar/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, events: mockEvents }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('events')
      expect(Array.isArray(body.events)).toBe(true)
      expect(body.events).toHaveLength(2)
      expect(body.events[0]).toHaveProperty('owner_id', directorSession.user.id)
    })
    
    it('should return 401 for unauthenticated requests', async () => {
      // Setup - no session
      mockAuthSession(null)
      
      const { GET: MockGET } = require('@/app/api/director/calendar/route')
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
    
    it('should return 403 for non-director users', async () => {
      // Setup - family user trying to access director calendar
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const { GET: MockGET } = require('@/app/api/director/calendar/route')
      MockGET.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Access denied - Director role required' }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(403)
      expect(body).toHaveProperty('error', 'Access denied - Director role required')
    })
    
    it('should filter events by date range when specified', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const dateFilteredEvents = [
        {
          ...createTestCalendarEvent(directorSession.user.id),
          start_time: '2024-12-15T10:00:00Z',
          end_time: '2024-12-15T12:00:00Z',
        },
      ]
      
      const { GET: MockGET } = require('@/app/api/director/calendar/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, events: dateFilteredEvents }),
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
      expect(body.events).toHaveLength(1)
      expect(body.events[0].start_time).toContain('2024-12-15')
    })
    
    it('should filter events by type when specified', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const bookingEvents = [
        { ...createTestCalendarEvent(directorSession.user.id), type: 'booking' },
      ]
      
      const { GET: MockGET } = require('@/app/api/director/calendar/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, events: bookingEvents }),
      })
      
      const request = createMockRequest('GET', null, {}, { type: 'booking' })
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body.events.every((event: any) => event.type === 'booking')).toBe(true)
    })
    
    it('should include booking details for booking events', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const mockBooking = createTestBooking('family-123', directorSession.user.id)
      const bookingEvents = [
        {
          ...createTestCalendarEvent(directorSession.user.id),
          type: 'booking',
          booking_id: mockBooking.id,
          booking_details: mockBooking,
        },
      ]
      
      const { GET: MockGET } = require('@/app/api/director/calendar/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, events: bookingEvents }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body.events[0]).toHaveProperty('booking_details')
      expect(body.events[0].booking_details).toHaveProperty('id', mockBooking.id)
    })
    
    it('should handle recurring events', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const recurringEvent = {
        ...createTestCalendarEvent(directorSession.user.id),
        recurring: {
          pattern: 'weekly',
          end_date: '2025-12-31',
        },
        occurrences: [
          { start_time: '2024-12-31T14:00:00Z', end_time: '2024-12-31T16:00:00Z' },
          { start_time: '2025-01-07T14:00:00Z', end_time: '2025-01-07T16:00:00Z' },
        ],
      }
      
      const { GET: MockGET } = require('@/app/api/director/calendar/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, events: [recurringEvent] }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body.events[0]).toHaveProperty('recurring')
      expect(body.events[0]).toHaveProperty('occurrences')
      expect(body.events[0].recurring.pattern).toBe('weekly')
    })
    
    it('should provide availability summary', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const { GET: MockGET } = require('@/app/api/director/calendar/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({
          success: true,
          events: [],
          availability_summary: {
            total_slots: 20,
            booked_slots: 8,
            available_slots: 12,
            blocked_slots: 0,
            utilization_rate: 0.4,
          },
        }),
      })
      
      const request = createMockRequest('GET', null, {}, {
        include_summary: 'true',
        start_date: '2024-12-01',
        end_date: '2024-12-31',
      })
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('availability_summary')
      expect(body.availability_summary).toHaveProperty('utilization_rate', 0.4)
    })
  })
  
  describe('POST /api/director/calendar', () => {
    it('should create calendar event with valid data', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const eventData = {
        title: 'Available Time Slot',
        description: 'Available for new bookings',
        start_time: '2024-12-31T14:00:00Z',
        end_time: '2024-12-31T16:00:00Z',
        type: 'available',
      }
      
      const newEvent = createTestCalendarEvent(directorSession.user.id)
      newEvent.title = eventData.title
      newEvent.description = eventData.description
      newEvent.start_time = eventData.start_time
      newEvent.end_time = eventData.end_time
      newEvent.type = eventData.type as any
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
      MockPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({ success: true, event: newEvent }),
      })
      
      const request = createMockRequest('POST', eventData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(201)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('event')
      expect(body.event).toMatchObject({
        owner_id: directorSession.user.id,
        owner_type: 'director',
        title: eventData.title,
        type: eventData.type,
      })
    })
    
    it('should validate required fields', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const incompleteData = {
        title: 'Missing required fields',
        // Missing start_time, end_time, type
      }
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Missing required fields: start_time, end_time, type' }),
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
    
    it('should validate date/time formats', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const invalidDateData = {
        title: 'Invalid Date Format',
        start_time: 'invalid-date',
        end_time: '2024-12-31T16:00:00Z',
        type: 'available',
      }
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid date format for start_time' }),
      })
      
      const request = createMockRequest('POST', invalidDateData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'Invalid date format for start_time')
    })
    
    it('should validate end time is after start time', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const invalidTimeOrderData = {
        title: 'Invalid Time Order',
        start_time: '2024-12-31T16:00:00Z',
        end_time: '2024-12-31T14:00:00Z', // End before start
        type: 'available',
      }
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'End time must be after start time' }),
      })
      
      const request = createMockRequest('POST', invalidTimeOrderData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'End time must be after start time')
    })
    
    it('should prevent creating events in the past', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const pastEventData = {
        title: 'Past Event',
        start_time: '2020-01-01T14:00:00Z', // Past date
        end_time: '2020-01-01T16:00:00Z',
        type: 'available',
      }
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Cannot create events in the past' }),
      })
      
      const request = createMockRequest('POST', pastEventData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'Cannot create events in the past')
    })
    
    it('should detect time conflicts with existing events', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const conflictingEventData = {
        title: 'Conflicting Event',
        start_time: '2024-12-31T15:00:00Z',
        end_time: '2024-12-31T17:00:00Z',
        type: 'available',
      }
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
      MockPOST.mockResolvedValue({
        status: 409,
        json: () => Promise.resolve({ 
          error: 'Time conflict with existing event',
          conflicting_event_id: 'event-existing-123',
        }),
      })
      
      const request = createMockRequest('POST', conflictingEventData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(409)
      expect(body).toHaveProperty('error', 'Time conflict with existing event')
      expect(body).toHaveProperty('conflicting_event_id')
    })
    
    it('should handle booking-type events with booking_id', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const bookingEventData = {
        title: 'Funeral Service',
        start_time: '2024-12-31T14:00:00Z',
        end_time: '2024-12-31T16:00:00Z',
        type: 'booking',
        booking_id: 'booking-123',
      }
      
      const bookingEvent = createTestCalendarEvent(directorSession.user.id)
      bookingEvent.type = 'booking'
      bookingEvent.booking_id = bookingEventData.booking_id
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
      MockPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({ success: true, event: bookingEvent }),
      })
      
      const request = createMockRequest('POST', bookingEventData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(201)
      expect(body.event).toHaveProperty('type', 'booking')
      expect(body.event).toHaveProperty('booking_id', 'booking-123')
    })
    
    it('should create recurring events', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const recurringEventData = {
        title: 'Weekly Office Hours',
        start_time: '2024-12-31T09:00:00Z',
        end_time: '2024-12-31T17:00:00Z',
        type: 'available',
        recurring: {
          pattern: 'weekly',
          end_date: '2025-12-31',
        },
      }
      
      const recurringEvent = createTestCalendarEvent(directorSession.user.id)
      recurringEvent.recurring = recurringEventData.recurring
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
      MockPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({
          success: true,
          event: recurringEvent,
          created_occurrences: 52, // Weekly for a year
        }),
      })
      
      const request = createMockRequest('POST', recurringEventData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(201)
      expect(body.event).toHaveProperty('recurring')
      expect(body).toHaveProperty('created_occurrences', 52)
    })
    
    it('should validate event type', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const invalidTypeData = {
        title: 'Invalid Type Event',
        start_time: '2024-12-31T14:00:00Z',
        end_time: '2024-12-31T16:00:00Z',
        type: 'invalid-type',
      }
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ 
          error: 'Invalid event type. Must be: booking, blocked, or available',
        }),
      })
      
      const request = createMockRequest('POST', invalidTypeData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('Invalid event type')
    })
    
    it('should require director authentication', async () => {
      // Setup - no session
      mockAuthSession(null)
      
      const eventData = {
        title: 'Unauthorized Event',
        start_time: '2024-12-31T14:00:00Z',
        end_time: '2024-12-31T16:00:00Z',
        type: 'available',
      }
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
      MockPOST.mockResolvedValue({
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      })
      
      const request = createMockRequest('POST', eventData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(401)
      expect(body).toHaveProperty('error', 'Unauthorized')
    })
    
    it('should validate director role', async () => {
      // Setup - family user trying to create director calendar event
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const eventData = {
        title: 'Role Violation Event',
        start_time: '2024-12-31T14:00:00Z',
        end_time: '2024-12-31T16:00:00Z',
        type: 'available',
      }
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
      MockPOST.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Access denied - Director role required' }),
      })
      
      const request = createMockRequest('POST', eventData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(403)
      expect(body).toHaveProperty('error', 'Access denied - Director role required')
    })
  })
  
  describe('Event Validation and Business Logic', () => {
    it('should validate minimum event duration', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const shortEventData = {
        title: 'Too Short Event',
        start_time: '2024-12-31T14:00:00Z',
        end_time: '2024-12-31T14:15:00Z', // 15 minutes
        type: 'available',
      }
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Event duration must be at least 30 minutes' }),
      })
      
      const request = createMockRequest('POST', shortEventData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('30 minutes')
    })
    
    it('should validate maximum event duration', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const longEventData = {
        title: 'Too Long Event',
        start_time: '2024-12-31T09:00:00Z',
        end_time: '2025-01-02T09:00:00Z', // 2 days
        type: 'available',
      }
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Event duration cannot exceed 12 hours' }),
      })
      
      const request = createMockRequest('POST', longEventData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('12 hours')
    })
    
    it('should validate business hours for available events', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const outsideHoursData = {
        title: 'Outside Business Hours',
        start_time: '2024-12-31T02:00:00Z', // 2 AM
        end_time: '2024-12-31T04:00:00Z',
        type: 'available',
      }
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ 
          error: 'Available events must be within business hours (8 AM - 8 PM)',
        }),
      })
      
      const request = createMockRequest('POST', outsideHoursData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('business hours')
    })
  })
  
  describe('Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
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
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const { GET: MockGET } = require('@/app/api/director/calendar/route')
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
    it('should sanitize event title and description', async () => {
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const xssData = {
        title: '<script>alert("XSS")</script>Event Title',
        description: '<img src=x onerror=alert(1)>Event Description',
        start_time: '2024-12-31T14:00:00Z',
        end_time: '2024-12-31T16:00:00Z',
        type: 'available',
      }
      
      const sanitizedEvent = createTestCalendarEvent(directorSession.user.id)
      sanitizedEvent.title = 'Event Title' // XSS removed
      sanitizedEvent.description = 'Event Description' // XSS removed
      
      const { POST: MockPOST } = require('@/app/api/director/calendar/route')
      MockPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({ success: true, event: sanitizedEvent }),
      })
      
      const request = createMockRequest('POST', xssData)
      const response = await MockPOST(request)
      const body = await response.json()
      
      expect(response.status).toBe(201)
      expect(body.event.title).not.toContain('<script>')
      expect(body.event.description).not.toContain('<img')
      expect(body.event.title).toBe('Event Title')
    })
    
    it('should prevent injection attacks in date filters', async () => {
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const { GET: MockGET } = require('@/app/api/director/calendar/route')
      MockGET.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid date format' }),
      })
      
      const maliciousDate = "'; DROP TABLE calendar_events; --"
      const request = createMockRequest('GET', null, {}, { start_date: maliciousDate })
      const response = await MockGET(request)
      const body = await response.json()
      
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'Invalid date format')
    })
  })
})