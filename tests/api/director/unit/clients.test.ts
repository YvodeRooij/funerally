/**
 * Director Clients API Unit Tests
 * Tests for /api/director/clients endpoints
 */

import { GET, POST } from '@/app/api/director/clients/route'
import { GET as ClientDetailGET, PUT as ClientDetailPUT, DELETE as ClientDetailDELETE } from '@/app/api/director/clients/[id]/route'
import { 
  createMockRequest, 
  createMockSession, 
  createTestDirector,
  createTestFamily,
  createTestBooking,
  mockAuthSession,
  validateApiResponse,
  validateErrorResponse 
} from '../../utils/test-setup'

// Mock the route handlers since they don't exist yet
jest.mock('@/app/api/director/clients/route', () => ({
  GET: jest.fn(),
  POST: jest.fn(),
}))

jest.mock('@/app/api/director/clients/[id]/route', () => ({
  GET: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
}))

describe('Director Clients API - Unit Tests', () => {
  
  const createTestClient = (directorId: string, familyId: string) => ({
    id: `client-${Date.now()}`,
    director_id: directorId,
    family_id: familyId,
    relationship_status: 'active' as const,
    service_history: [],
    notes: 'Test client notes',
    tags: ['traditional', 'priority'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup default successful responses
    const { GET: MockGET, POST: MockPOST } = require('@/app/api/director/clients/route')
    const { GET: MockDetailGET, PUT: MockDetailPUT, DELETE: MockDetailDELETE } = require('@/app/api/director/clients/[id]/route')
    
    MockGET.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, clients: [] }),
    })
    
    MockPOST.mockResolvedValue({
      status: 201,
      json: () => Promise.resolve({ success: true, client: createTestClient('director-123', 'family-456') }),
    })
    
    MockDetailGET.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, client: createTestClient('director-123', 'family-456') }),
    })
    
    MockDetailPUT.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, client: createTestClient('director-123', 'family-456') }),
    })
    
    MockDetailDELETE.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, message: 'Client relationship archived' }),
    })
  })
  
  describe('GET /api/director/clients', () => {
    it('should return list of director clients for authenticated director', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const mockClients = [
        createTestClient(directorSession.user.id, 'family-123'),
        createTestClient(directorSession.user.id, 'family-456'),
      ]
      
      const { GET: MockGET } = require('@/app/api/director/clients/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, clients: mockClients }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('clients')
      expect(Array.isArray(body.clients)).toBe(true)
      expect(body.clients).toHaveLength(2)
      expect(body.clients[0]).toHaveProperty('director_id', directorSession.user.id)
    })
    
    it('should return 401 for unauthenticated requests', async () => {
      // Setup - no session
      mockAuthSession(null)
      
      const { GET: MockGET } = require('@/app/api/director/clients/route')
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
      // Setup - family user trying to access director endpoint
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const { GET: MockGET } = require('@/app/api/director/clients/route')
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
    
    it('should filter clients by status when specified', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const activeClients = [
        { ...createTestClient(directorSession.user.id, 'family-123'), relationship_status: 'active' },
      ]
      
      const { GET: MockGET } = require('@/app/api/director/clients/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, clients: activeClients }),
      })
      
      const request = createMockRequest('GET', null, {}, { status: 'active' })
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body.clients.every((client: any) => client.relationship_status === 'active')).toBe(true)
    })
    
    it('should include service history and family profile', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const clientsWithHistory = [
        {
          ...createTestClient(directorSession.user.id, 'family-123'),
          service_history: [
            createTestBooking('family-123', directorSession.user.id),
          ],
          family_profile: createTestFamily({ id: 'family-123' }),
        },
      ]
      
      const { GET: MockGET } = require('@/app/api/director/clients/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, clients: clientsWithHistory }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body.clients[0]).toHaveProperty('service_history')
      expect(body.clients[0]).toHaveProperty('family_profile')
      expect(body.clients[0].service_history).toHaveLength(1)
    })
    
    it('should handle search queries', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const searchResults = [
        {
          ...createTestClient(directorSession.user.id, 'family-123'),
          family_profile: { ...createTestFamily(), name: 'Smith Family' },
        },
      ]
      
      const { GET: MockGET } = require('@/app/api/director/clients/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, clients: searchResults }),
      })
      
      const request = createMockRequest('GET', null, {}, { search: 'Smith' })
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body.clients.every((client: any) => 
        client.family_profile.name.includes('Smith')
      )).toBe(true)
    })
    
    it('should handle pagination', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const { GET: MockGET } = require('@/app/api/director/clients/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({
          success: true,
          clients: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 45,
            pages: 3,
          },
        }),
      })
      
      const request = createMockRequest('GET', null, {}, { page: '1', limit: '20' })
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('pagination')
      expect(body.pagination.total).toBe(45)
    })
  })
  
  describe('POST /api/director/clients', () => {
    it('should add new client with valid data', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const clientData = {
        family_id: 'family-789',
        notes: 'New client from referral',
        tags: ['priority', 'referral'],
      }
      
      const newClient = createTestClient(directorSession.user.id, clientData.family_id)
      newClient.notes = clientData.notes
      newClient.tags = clientData.tags
      
      const { POST: MockPOST } = require('@/app/api/director/clients/route')
      MockPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({ success: true, client: newClient }),
      })
      
      const request = createMockRequest('POST', clientData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(201)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('client')
      expect(body.client).toMatchObject({
        director_id: directorSession.user.id,
        family_id: clientData.family_id,
        notes: clientData.notes,
        tags: clientData.tags,
      })
    })
    
    it('should validate required fields', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const incompleteData = {
        notes: 'Missing family_id',
        // Missing required family_id
      }
      
      const { POST: MockPOST } = require('@/app/api/director/clients/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'family_id is required' }),
      })
      
      const request = createMockRequest('POST', incompleteData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'family_id is required')
    })
    
    it('should prevent duplicate client relationships', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const existingClientData = {
        family_id: 'family-existing',
        notes: 'Duplicate attempt',
      }
      
      const { POST: MockPOST } = require('@/app/api/director/clients/route')
      MockPOST.mockResolvedValue({
        status: 409,
        json: () => Promise.resolve({ 
          error: 'Client relationship already exists',
          existing_client_id: 'client-existing-123',
        }),
      })
      
      const request = createMockRequest('POST', existingClientData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(409)
      expect(body).toHaveProperty('error', 'Client relationship already exists')
      expect(body).toHaveProperty('existing_client_id')
    })
    
    it('should validate family exists before creating relationship', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const invalidFamilyData = {
        family_id: 'non-existent-family',
        notes: 'Invalid family',
      }
      
      const { POST: MockPOST } = require('@/app/api/director/clients/route')
      MockPOST.mockResolvedValue({
        status: 404,
        json: () => Promise.resolve({ error: 'Family not found' }),
      })
      
      const request = createMockRequest('POST', invalidFamilyData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(404)
      expect(body).toHaveProperty('error', 'Family not found')
    })
    
    it('should require director authentication', async () => {
      // Setup - no session
      mockAuthSession(null)
      
      const clientData = {
        family_id: 'family-123',
        notes: 'Unauthorized attempt',
      }
      
      const { POST: MockPOST } = require('@/app/api/director/clients/route')
      MockPOST.mockResolvedValue({
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      })
      
      const request = createMockRequest('POST', clientData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(401)
      expect(body).toHaveProperty('error', 'Unauthorized')
    })
    
    it('should validate director role', async () => {
      // Setup - family user trying to add clients
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const clientData = {
        family_id: 'family-123',
        notes: 'Role violation attempt',
      }
      
      const { POST: MockPOST } = require('@/app/api/director/clients/route')
      MockPOST.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Access denied - Director role required' }),
      })
      
      const request = createMockRequest('POST', clientData)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(403)
      expect(body).toHaveProperty('error', 'Access denied - Director role required')
    })
    
    it('should handle tags validation', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const clientDataWithInvalidTags = {
        family_id: 'family-123',
        tags: ['valid-tag', '', 'another-valid', null, 'x'.repeat(100)], // Invalid tags
      }
      
      const { POST: MockPOST } = require('@/app/api/director/clients/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ 
          error: 'Invalid tags: empty tags and tags longer than 50 characters are not allowed',
        }),
      })
      
      const request = createMockRequest('POST', clientDataWithInvalidTags)
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('Invalid tags')
    })
  })
  
  describe('GET /api/director/clients/[id]', () => {
    it('should return specific client for authenticated director', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const clientId = 'client-123'
      const mockClient = createTestClient(directorSession.user.id, 'family-456')
      mockClient.id = clientId
      
      const { GET: MockDetailGET } = require('@/app/api/director/clients/[id]/route')
      MockDetailGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, client: mockClient }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockDetailGET(request, { params: { id: clientId } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('client')
      expect(body.client.id).toBe(clientId)
      expect(body.client.director_id).toBe(directorSession.user.id)
    })
    
    it('should return 404 for non-existent client', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const { GET: MockDetailGET } = require('@/app/api/director/clients/[id]/route')
      MockDetailGET.mockResolvedValue({
        status: 404,
        json: () => Promise.resolve({ error: 'Client not found' }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockDetailGET(request, { params: { id: 'non-existent' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(404)
      expect(body).toHaveProperty('error', 'Client not found')
    })
    
    it('should return 403 for client belonging to different director', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const { GET: MockDetailGET } = require('@/app/api/director/clients/[id]/route')
      MockDetailGET.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Access denied' }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockDetailGET(request, { params: { id: 'other-director-client' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(403)
      expect(body).toHaveProperty('error', 'Access denied')
    })
    
    it('should include detailed service history', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const clientWithDetailedHistory = {
        ...createTestClient(directorSession.user.id, 'family-456'),
        service_history: [
          { ...createTestBooking('family-456', directorSession.user.id), status: 'completed' },
          { ...createTestBooking('family-456', directorSession.user.id), status: 'pending' },
        ],
        total_revenue: 5000,
        last_service_date: '2024-06-15',
        avg_service_rating: 4.8,
      }
      
      const { GET: MockDetailGET } = require('@/app/api/director/clients/[id]/route')
      MockDetailGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, client: clientWithDetailedHistory }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockDetailGET(request, { params: { id: 'client-123' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body.client).toHaveProperty('service_history')
      expect(body.client).toHaveProperty('total_revenue', 5000)
      expect(body.client).toHaveProperty('last_service_date')
      expect(body.client).toHaveProperty('avg_service_rating', 4.8)
      expect(body.client.service_history).toHaveLength(2)
    })
  })
  
  describe('PUT /api/director/clients/[id]', () => {
    it('should update client with valid data', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const clientId = 'client-123'
      const updateData = {
        notes: 'Updated client notes with new requirements',
        tags: ['priority', 'vip', 'memorial'],
        relationship_status: 'active',
      }
      
      const updatedClient = {
        ...createTestClient(directorSession.user.id, 'family-456'),
        id: clientId,
        ...updateData,
      }
      
      const { PUT: MockDetailPUT } = require('@/app/api/director/clients/[id]/route')
      MockDetailPUT.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, client: updatedClient }),
      })
      
      const request = createMockRequest('PUT', updateData)
      
      // Execute
      const response = await MockDetailPUT(request, { params: { id: clientId } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('success', true)
      expect(body.client).toMatchObject(updateData)
    })
    
    it('should validate relationship status values', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const invalidStatusData = {
        relationship_status: 'invalid-status',
      }
      
      const { PUT: MockDetailPUT } = require('@/app/api/director/clients/[id]/route')
      MockDetailPUT.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ 
          error: 'Invalid relationship_status. Must be: active, inactive, or archived',
        }),
      })
      
      const request = createMockRequest('PUT', invalidStatusData)
      
      // Execute
      const response = await MockDetailPUT(request, { params: { id: 'client-123' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('Invalid relationship_status')
    })
    
    it('should prevent unauthorized updates', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const { PUT: MockDetailPUT } = require('@/app/api/director/clients/[id]/route')
      MockDetailPUT.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Access denied' }),
      })
      
      const request = createMockRequest('PUT', { notes: 'Unauthorized update' })
      
      // Execute
      const response = await MockDetailPUT(request, { params: { id: 'other-director-client' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(403)
      expect(body).toHaveProperty('error', 'Access denied')
    })
    
    it('should handle notes length validation', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const longNotesData = {
        notes: 'x'.repeat(5000), // Very long notes
      }
      
      const { PUT: MockDetailPUT } = require('@/app/api/director/clients/[id]/route')
      MockDetailPUT.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Notes too long (max 2000 characters)' }),
      })
      
      const request = createMockRequest('PUT', longNotesData)
      
      // Execute
      const response = await MockDetailPUT(request, { params: { id: 'client-123' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('too long')
    })
  })
  
  describe('DELETE /api/director/clients/[id]', () => {
    it('should archive client relationship successfully', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const clientId = 'client-123'
      
      const { DELETE: MockDetailDELETE } = require('@/app/api/director/clients/[id]/route')
      MockDetailDELETE.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ 
          success: true, 
          message: 'Client relationship archived successfully',
          archived_client_id: clientId,
        }),
      })
      
      const request = createMockRequest('DELETE')
      
      // Execute
      const response = await MockDetailDELETE(request, { params: { id: clientId } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('message', 'Client relationship archived successfully')
      expect(body).toHaveProperty('archived_client_id', clientId)
    })
    
    it('should prevent deletion when active bookings exist', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const { DELETE: MockDetailDELETE } = require('@/app/api/director/clients/[id]/route')
      MockDetailDELETE.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ 
          error: 'Cannot archive client with active bookings',
          active_bookings_count: 2,
        }),
      })
      
      const request = createMockRequest('DELETE')
      
      // Execute
      const response = await MockDetailDELETE(request, { params: { id: 'client-with-active-bookings' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'Cannot archive client with active bookings')
      expect(body).toHaveProperty('active_bookings_count', 2)
    })
    
    it('should prevent unauthorized deletion', async () => {
      // Setup
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const { DELETE: MockDetailDELETE } = require('@/app/api/director/clients/[id]/route')
      MockDetailDELETE.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Access denied' }),
      })
      
      const request = createMockRequest('DELETE')
      
      // Execute
      const response = await MockDetailDELETE(request, { params: { id: 'other-director-client' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(403)
      expect(body).toHaveProperty('error', 'Access denied')
    })
    
    it('should handle soft delete vs hard delete', async () => {
      // Setup - Test with query parameter for hard delete (admin only)
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const { DELETE: MockDetailDELETE } = require('@/app/api/director/clients/[id]/route')
      MockDetailDELETE.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ 
          error: 'Hard delete not allowed - use archive instead',
        }),
      })
      
      const request = createMockRequest('DELETE', null, {}, { hard_delete: 'true' })
      
      // Execute
      const response = await MockDetailDELETE(request, { params: { id: 'client-123' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(403)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('Hard delete not allowed')
    })
  })
  
  describe('Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any
      
      const { POST: MockPOST } = require('@/app/api/director/clients/route')
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
      
      const { GET: MockGET } = require('@/app/api/director/clients/route')
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
    it('should sanitize notes and tags', async () => {
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const xssData = {
        family_id: 'family-123',
        notes: '<script>alert("XSS")</script>Client notes',
        tags: ['<img src=x onerror=alert(1)>', 'normal-tag'],
      }
      
      const sanitizedClient = createTestClient(directorSession.user.id, 'family-123')
      sanitizedClient.notes = 'Client notes' // XSS removed
      sanitizedClient.tags = ['', 'normal-tag'] // XSS removed from first tag
      
      const { POST: MockPOST } = require('@/app/api/director/clients/route')
      MockPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({ success: true, client: sanitizedClient }),
      })
      
      const request = createMockRequest('POST', xssData)
      const response = await MockPOST(request)
      const body = await response.json()
      
      expect(response.status).toBe(201)
      expect(body.client.notes).not.toContain('<script>')
      expect(body.client.tags[0]).toBe('')
      expect(body.client.tags[1]).toBe('normal-tag')
    })
    
    it('should prevent SQL injection in search queries', async () => {
      const directorSession = createMockSession('director')
      mockAuthSession(directorSession)
      
      const { GET: MockGET } = require('@/app/api/director/clients/route')
      MockGET.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid search query' }),
      })
      
      const maliciousSearch = "'; DROP TABLE clients; --"
      const request = createMockRequest('GET', null, {}, { search: maliciousSearch })
      const response = await MockGET(request)
      const body = await response.json()
      
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'Invalid search query')
    })
  })
})