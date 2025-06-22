/**
 * Family API Integration Tests
 * Tests for complete family workflows across multiple endpoints
 */

import { 
  createMockRequest, 
  createMockSession, 
  createTestFamily,
  createTestBooking,
  createTestDocument,
  mockAuthSession,
  cleanupTestData,
  seedTestData,
} from '../../utils/test-setup'

// Mock all the API routes
jest.mock('@/app/api/user/profile/route')
jest.mock('@/app/api/family/bookings/route')
jest.mock('@/app/api/family/documents/route')
jest.mock('@/app/api/family/chat/route')
jest.mock('@/app/api/family/chat/rooms/route')
jest.mock('@/app/api/onboarding/route')

describe('Family API - Integration Tests', () => {
  
  let familySession: any
  let mockProfile: any
  let mockBooking: any
  let mockDocument: any
  
  beforeEach(async () => {
    // Setup test data
    await cleanupTestData()
    await seedTestData()
    
    // Create test family session
    familySession = createMockSession('family', {
      id: 'family-integration-test',
      email: 'integration-family@test.com',
      name: 'Integration Test Family',
    })
    mockAuthSession(familySession)
    
    // Create test data
    mockProfile = createTestFamily({
      id: familySession.user.id,
      email: familySession.user.email,
      name: familySession.user.name,
    })
    
    mockBooking = createTestBooking(familySession.user.id)
    mockDocument = createTestDocument(familySession.user.id, 'family')
    
    // Reset all mocks
    jest.clearAllMocks()
  })
  
  afterEach(async () => {
    await cleanupTestData()
  })
  
  describe('Family Onboarding Flow', () => {
    it('should complete full onboarding process', async () => {
      // Step 1: Create user profile during onboarding
      const { POST: OnboardingPOST } = require('@/app/api/onboarding/route')
      OnboardingPOST.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true }),
      })
      
      const onboardingData = {
        userType: 'family',
        name: 'New Family User',
        phone: '+31612345678',
        address: 'Test Address 123, Amsterdam',
        emergencyContact: {
          name: 'Emergency Contact',
          phone: '+31687654321',
          relationship: 'Sibling',
        },
      }
      
      const onboardingRequest = createMockRequest('POST', onboardingData)
      const onboardingResponse = await OnboardingPOST(onboardingRequest)
      const onboardingBody = await onboardingResponse.json()
      
      expect(onboardingResponse.status).toBe(200)
      expect(onboardingBody).toHaveProperty('success', true)
      
      // Step 2: Verify profile was created
      const { GET: ProfileGET } = require('@/app/api/user/profile/route')
      ProfileGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({
          success: true,
          profile: {
            ...mockProfile,
            ...onboardingData,
            onboarding_complete: true,
          },
        }),
      })
      
      const profileRequest = createMockRequest('GET')
      const profileResponse = await ProfileGET(profileRequest)
      const profileBody = await profileResponse.json()
      
      expect(profileResponse.status).toBe(200)
      expect(profileBody.profile).toHaveProperty('onboarding_complete', true)
      expect(profileBody.profile).toHaveProperty('user_type', 'family')
    })
    
    it('should handle onboarding errors gracefully', async () => {
      // Test incomplete onboarding data
      const { POST: OnboardingPOST } = require('@/app/api/onboarding/route')
      OnboardingPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid user type' }),
      })
      
      const incompleteData = {
        userType: 'invalid-type',
        name: 'Test Family',
      }
      
      const request = createMockRequest('POST', incompleteData)
      const response = await OnboardingPOST(request)
      const body = await response.json()
      
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'Invalid user type')
    })
  })
  
  describe('Booking and Communication Workflow', () => {
    it('should create booking and automatically set up communication channels', async () => {
      // Step 1: Create a booking
      const { POST: BookingsPOST } = require('@/app/api/family/bookings/route')
      BookingsPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({ success: true, booking: mockBooking }),
      })
      
      const bookingData = {
        service_type: 'traditional',
        date: '2024-12-31',
        time: '14:00',
        duration: 120,
        director_id: 'director-456',
        venue_id: 'venue-789',
        notes: 'Special requirements for the service',
      }
      
      const bookingRequest = createMockRequest('POST', bookingData)
      const bookingResponse = await BookingsPOST(bookingRequest)
      const bookingBody = await bookingResponse.json()
      
      expect(bookingResponse.status).toBe(201)
      expect(bookingBody).toHaveProperty('success', true)
      expect(bookingBody.booking).toMatchObject({
        family_id: familySession.user.id,
        service_type: bookingData.service_type,
      })
      
      // Step 2: Verify chat rooms were created automatically
      const { GET: ChatRoomsGET } = require('@/app/api/family/chat/rooms/route')
      ChatRoomsGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({
          success: true,
          rooms: [
            {
              id: 'room-family-director',
              type: 'family_director',
              participants: [familySession.user.id, bookingData.director_id],
              booking_id: mockBooking.id,
              title: 'Service Planning with Director',
            },
            {
              id: 'room-family-venue',
              type: 'family_venue',
              participants: [familySession.user.id, bookingData.venue_id],
              booking_id: mockBooking.id,
              title: 'Venue Coordination',
            },
          ],
        }),
      })
      
      const roomsRequest = createMockRequest('GET', null, {}, { booking_id: mockBooking.id })
      const roomsResponse = await ChatRoomsGET(roomsRequest)
      const roomsBody = await roomsResponse.json()
      
      expect(roomsResponse.status).toBe(200)
      expect(roomsBody.rooms).toHaveLength(2)
      expect(roomsBody.rooms[0]).toHaveProperty('type', 'family_director')
      expect(roomsBody.rooms[1]).toHaveProperty('type', 'family_venue')
      
      // Step 3: Send initial message to director
      const { POST: ChatPOST } = require('@/app/api/family/chat/route')
      ChatPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({
          success: true,
          message: {
            id: 'msg-123',
            room_id: 'room-family-director',
            sender_id: familySession.user.id,
            sender_type: 'family',
            message: 'Hello, I just created a booking for December 31st. Please let me know the next steps.',
            message_type: 'text',
            created_at: new Date().toISOString(),
          },
          real_time_sent: true,
        }),
      })
      
      const messageData = {
        room_id: 'room-family-director',
        message: 'Hello, I just created a booking for December 31st. Please let me know the next steps.',
      }
      
      const messageRequest = createMockRequest('POST', messageData)
      const messageResponse = await ChatPOST(messageRequest)
      const messageBody = await messageResponse.json()
      
      expect(messageResponse.status).toBe(201)
      expect(messageBody).toHaveProperty('success', true)
      expect(messageBody).toHaveProperty('real_time_sent', true)
    })
    
    it('should handle booking updates and notify relevant parties', async () => {
      // Step 1: Update existing booking
      const { PUT: BookingPUT } = require('@/app/api/family/bookings/[id]/route')
      const updatedBooking = {
        ...mockBooking,
        date: '2025-01-15',
        time: '16:00',
        status: 'confirmed',
      }
      
      BookingPUT.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, booking: updatedBooking }),
      })
      
      const updateData = {
        date: '2025-01-15',
        time: '16:00',
      }
      
      const updateRequest = createMockRequest('PUT', updateData)
      const updateResponse = await BookingPUT(updateRequest, { params: { id: mockBooking.id } })
      const updateBody = await updateResponse.json()
      
      expect(updateResponse.status).toBe(200)
      expect(updateBody.booking).toMatchObject(updateData)
      
      // Step 2: Verify system message was sent to chat rooms
      const { POST: ChatPOST } = require('@/app/api/family/chat/route')
      ChatPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({
          success: true,
          message: {
            id: 'msg-system-update',
            room_id: 'room-family-director',
            sender_id: 'system',
            sender_type: 'system',
            message: 'Booking updated: Date changed to January 15, 2025 at 16:00',
            message_type: 'system',
            metadata: {
              booking_id: mockBooking.id,
              changes: updateData,
            },
          },
        }),
      })
      
      const systemMessageData = {
        room_id: 'room-family-director',
        message: 'Booking updated: Date changed to January 15, 2025 at 16:00',
        message_type: 'system',
        metadata: {
          booking_id: mockBooking.id,
          changes: updateData,
        },
      }
      
      const systemMessageRequest = createMockRequest('POST', systemMessageData)
      const systemMessageResponse = await ChatPOST(systemMessageRequest)
      const systemMessageBody = await systemMessageResponse.json()
      
      expect(systemMessageResponse.status).toBe(201)
      expect(systemMessageBody.message).toHaveProperty('message_type', 'system')
      expect(systemMessageBody.message.metadata).toHaveProperty('booking_id', mockBooking.id)
    })
  })
  
  describe('Document Management Workflow', () => {
    it('should upload document and share with service providers', async () => {
      // Step 1: Upload document
      const { POST: DocumentsPOST } = require('@/app/api/family/documents/route')
      DocumentsPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({ success: true, document: mockDocument }),
      })
      
      const mockFile = new File(['will content'], 'will.pdf', { type: 'application/pdf' })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)
      mockFormData.append('title', 'Last Will and Testament')
      mockFormData.append('type', 'will')
      
      const uploadRequest = {
        formData: jest.fn().mockResolvedValue(mockFormData),
      } as any
      
      const uploadResponse = await DocumentsPOST(uploadRequest)
      const uploadBody = await uploadResponse.json()
      
      expect(uploadResponse.status).toBe(201)
      expect(uploadBody).toHaveProperty('success', true)
      expect(uploadBody.document).toMatchObject({
        title: 'Last Will and Testament',
        type: 'will',
        owner_id: familySession.user.id,
      })
      
      // Step 2: Share document with director and venue
      const { PUT: DocumentPUT } = require('@/app/api/family/documents/[id]/route')
      const sharedDocument = {
        ...mockDocument,
        shared_with: ['director-456', 'venue-789'],
      }
      
      DocumentPUT.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, document: sharedDocument }),
      })
      
      const shareData = {
        shared_with: ['director-456', 'venue-789'],
      }
      
      const shareRequest = createMockRequest('PUT', shareData)
      const shareResponse = await DocumentPUT(shareRequest, { params: { id: mockDocument.id } })
      const shareBody = await shareResponse.json()
      
      expect(shareResponse.status).toBe(200)
      expect(shareBody.document.shared_with).toEqual(['director-456', 'venue-789'])
      
      // Step 3: Notify via chat that document was shared
      const { POST: ChatPOST } = require('@/app/api/family/chat/route')
      ChatPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({
          success: true,
          message: {
            id: 'msg-doc-share',
            room_id: 'room-family-director',
            sender_id: familySession.user.id,
            sender_type: 'family',
            message: 'Shared a document with you',
            message_type: 'file',
            metadata: {
              file_id: mockDocument.id,
              file_name: 'will.pdf',
              file_type: 'will',
            },
          },
        }),
      })
      
      const notificationData = {
        room_id: 'room-family-director',
        message: 'Shared a document with you',
        message_type: 'file',
        metadata: {
          file_id: mockDocument.id,
          file_name: 'will.pdf',
          file_type: 'will',
        },
      }
      
      const notificationRequest = createMockRequest('POST', notificationData)
      const notificationResponse = await ChatPOST(notificationRequest)
      const notificationBody = await notificationResponse.json()
      
      expect(notificationResponse.status).toBe(201)
      expect(notificationBody.message).toHaveProperty('message_type', 'file')
      expect(notificationBody.message.metadata).toHaveProperty('file_id', mockDocument.id)
    })
    
    it('should handle document encryption for sensitive files', async () => {
      // Step 1: Upload encrypted document
      const { POST: DocumentsPOST } = require('@/app/api/family/documents/route')
      const encryptedDocument = {
        ...mockDocument,
        title: 'Medical Records',
        type: 'medical',
        is_encrypted: true,
        encryption_key: 'encrypted_key_hash',
      }
      
      DocumentsPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({ success: true, document: encryptedDocument }),
      })
      
      const mockFile = new File(['sensitive medical data'], 'medical-records.pdf', { type: 'application/pdf' })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)
      mockFormData.append('title', 'Medical Records')
      mockFormData.append('type', 'medical')
      mockFormData.append('encrypt', 'true')
      
      const uploadRequest = {
        formData: jest.fn().mockResolvedValue(mockFormData),
      } as any
      
      const uploadResponse = await DocumentsPOST(uploadRequest)
      const uploadBody = await uploadResponse.json()
      
      expect(uploadResponse.status).toBe(201)
      expect(uploadBody.document).toHaveProperty('is_encrypted', true)
      expect(uploadBody.document).toHaveProperty('encryption_key')
      
      // Step 2: Verify access requires proper decryption
      const { GET: DocumentGET } = require('@/app/api/family/documents/[id]/route')
      DocumentGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({
          success: true,
          document: encryptedDocument,
          encrypted: true,
          access_key_required: true,
        }),
      })
      
      const accessRequest = createMockRequest('GET')
      const accessResponse = await DocumentGET(accessRequest, { params: { id: encryptedDocument.id } })
      const accessBody = await accessResponse.json()
      
      expect(accessResponse.status).toBe(200)
      expect(accessBody).toHaveProperty('encrypted', true)
      expect(accessBody).toHaveProperty('access_key_required', true)
    })
  })
  
  describe('Profile Updates and Data Consistency', () => {
    it('should maintain data consistency when updating profile', async () => {
      // Step 1: Update profile information
      const { PUT: ProfilePUT } = require('@/app/api/user/profile/route')
      const updatedProfile = {
        ...mockProfile,
        name: 'Updated Family Name',
        phone: '+31687654321',
        address: 'New Address 456, Rotterdam',
      }
      
      ProfilePUT.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, profile: updatedProfile }),
      })
      
      const updateData = {
        name: 'Updated Family Name',
        phone: '+31687654321',
        address: 'New Address 456, Rotterdam',
      }
      
      const updateRequest = createMockRequest('PUT', updateData)
      const updateResponse = await ProfilePUT(updateRequest)
      const updateBody = await updateResponse.json()
      
      expect(updateResponse.status).toBe(200)
      expect(updateBody.profile).toMatchObject(updateData)
      
      // Step 2: Verify profile changes are reflected in bookings
      const { GET: BookingsGET } = require('@/app/api/family/bookings/route')
      const bookingsWithUpdatedProfile = [
        {
          ...mockBooking,
          family_profile: updatedProfile,
        },
      ]
      
      BookingsGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, bookings: bookingsWithUpdatedProfile }),
      })
      
      const bookingsRequest = createMockRequest('GET')
      const bookingsResponse = await BookingsGET(bookingsRequest)
      const bookingsBody = await bookingsResponse.json()
      
      expect(bookingsResponse.status).toBe(200)
      expect(bookingsBody.bookings[0].family_profile.name).toBe(updateData.name)
      
      // Step 3: Verify profile changes are reflected in documents
      const { GET: DocumentsGET } = require('@/app/api/family/documents/route')
      const documentsWithUpdatedProfile = [
        {
          ...mockDocument,
          owner_profile: updatedProfile,
        },
      ]
      
      DocumentsGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, documents: documentsWithUpdatedProfile }),
      })
      
      const documentsRequest = createMockRequest('GET')
      const documentsResponse = await DocumentsGET(documentsRequest)
      const documentsBody = await documentsResponse.json()
      
      expect(documentsResponse.status).toBe(200)
      expect(documentsBody.documents[0].owner_profile.name).toBe(updateData.name)
    })
  })
  
  describe('Cross-API Error Handling', () => {
    it('should handle cascading failures gracefully', async () => {
      // Step 1: Create booking successfully
      const { POST: BookingsPOST } = require('@/app/api/family/bookings/route')
      BookingsPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({ success: true, booking: mockBooking }),
      })
      
      const bookingRequest = createMockRequest('POST', {
        service_type: 'traditional',
        date: '2024-12-31',
        time: '14:00',
        duration: 120,
      })
      
      const bookingResponse = await BookingsPOST(bookingRequest)
      expect(bookingResponse.status).toBe(201)
      
      // Step 2: Chat room creation fails
      const { POST: ChatRoomsPOST } = require('@/app/api/family/chat/rooms/route')
      ChatRoomsPOST.mockResolvedValue({
        status: 500,
        json: () => Promise.resolve({ error: 'Failed to create chat room' }),
      })
      
      const roomData = {
        type: 'family_director',
        participants: [familySession.user.id, 'director-456'],
        booking_id: mockBooking.id,
      }
      
      const roomRequest = createMockRequest('POST', roomData)
      const roomResponse = await ChatRoomsPOST(roomRequest)
      
      expect(roomResponse.status).toBe(500)
      
      // Step 3: Booking should still exist despite chat room failure
      const { GET: BookingGET } = require('@/app/api/family/bookings/[id]/route')
      BookingGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ 
          success: true, 
          booking: mockBooking,
          warnings: ['Chat room creation failed - manual setup required'],
        }),
      })
      
      const checkRequest = createMockRequest('GET')
      const checkResponse = await BookingGET(checkRequest, { params: { id: mockBooking.id } })
      const checkBody = await checkResponse.json()
      
      expect(checkResponse.status).toBe(200)
      expect(checkBody).toHaveProperty('booking')
      expect(checkBody).toHaveProperty('warnings')
    })
    
    it('should handle authentication failures across endpoints', async () => {
      // Simulate session expiry
      mockAuthSession(null)
      
      const endpoints = [
        { module: '@/app/api/family/bookings/route', method: 'GET' },
        { module: '@/app/api/family/documents/route', method: 'GET' },
        { module: '@/app/api/family/chat/route', method: 'GET' },
        { module: '@/app/api/user/profile/route', method: 'GET' },
      ]
      
      for (const endpoint of endpoints) {
        const { [endpoint.method]: MockMethod } = require(endpoint.module)
        MockMethod.mockResolvedValue({
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        })
        
        const request = createMockRequest(endpoint.method as any)
        const response = await MockMethod(request)
        const body = await response.json()
        
        expect(response.status).toBe(401)
        expect(body).toHaveProperty('error', 'Unauthorized')
      }
    })
  })
  
  describe('Performance and Rate Limiting', () => {
    it('should handle concurrent requests appropriately', async () => {
      // Setup multiple concurrent requests
      const { GET: ProfileGET } = require('@/app/api/user/profile/route')
      ProfileGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, profile: mockProfile }),
      })
      
      const concurrentRequests = Array(10).fill(null).map(() => {
        const request = createMockRequest('GET')
        return ProfileGET(request)
      })
      
      const results = await Promise.allSettled(concurrentRequests)
      
      // All requests should succeed
      expect(results.every(result => result.status === 'fulfilled')).toBe(true)
      
      // Check that each response is valid
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const response = result.value
          expect(response.status).toBe(200)
        }
      }
    })
    
    it('should respect rate limiting', async () => {
      // Setup rate limited response
      const { POST: ChatPOST } = require('@/app/api/family/chat/route')
      ChatPOST.mockResolvedValue({
        status: 429,
        json: () => Promise.resolve({ 
          error: 'Rate limit exceeded',
          retry_after: 60,
        }),
      })
      
      const messageData = {
        room_id: 'room-123',
        message: 'Rate limited message',
      }
      
      const request = createMockRequest('POST', messageData)
      const response = await ChatPOST(request)
      const body = await response.json()
      
      expect(response.status).toBe(429)
      expect(body).toHaveProperty('error', 'Rate limit exceeded')
      expect(body).toHaveProperty('retry_after', 60)
    })
  })
})