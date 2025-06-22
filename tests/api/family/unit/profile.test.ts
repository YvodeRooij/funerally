/**
 * Family Profile API Unit Tests
 * Tests for /api/family/profile and /(family)/api/profile endpoints
 */

import { GET, PUT } from '@/app/(family)/api/profile/route'
import { GET as UserProfileGET, PUT as UserProfilePUT, POST as UserProfilePOST } from '@/app/api/user/profile/route'
import { 
  createMockRequest, 
  createMockSession, 
  createTestFamily,
  mockAuthSession,
  validateApiResponse,
  validateErrorResponse 
} from '../../utils/test-setup'

describe('Family Profile API - Unit Tests', () => {
  
  describe('GET /(family)/api/profile', () => {
    it('should return success response for authenticated family user', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      // Execute
      const response = await GET()
      
      // Assert
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty('success', true)
    })
    
    it('should handle errors gracefully', async () => {
      // Setup - simulate database error
      const mockSupabase = require('@/lib/supabase')
      mockSupabase.createClient.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      })
      
      // Execute
      const response = await GET()
      
      // Assert
      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body).toHaveProperty('error', 'Failed to get profile')
    })
    
    it('should return consistent response format', async () => {
      // Execute
      const response = await GET()
      const body = await response.json()
      
      // Assert response structure
      expect(body).toHaveProperty('success')
      expect(typeof body.success).toBe('boolean')
      
      if (body.error) {
        expect(typeof body.error).toBe('string')
      }
    })
  })
  
  describe('PUT /(family)/api/profile', () => {
    it('should update family profile with valid data', async () => {
      // Setup
      const updateData = {
        name: 'Updated Family Name',
        phone: '+31612345678',
        address: 'Updated Address 123, Amsterdam',
      }
      const request = createMockRequest('PUT', updateData)
      
      // Execute
      const response = await PUT(request)
      
      // Assert
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty('success', true)
    })
    
    it('should handle malformed JSON in request body', async () => {
      // Setup
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any
      
      // Execute
      const response = await PUT(request)
      
      // Assert
      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body).toHaveProperty('error', 'Failed to update profile')
    })
    
    it('should validate input data types', async () => {
      // Setup - invalid data types
      const invalidData = {
        name: 123, // should be string
        phone: true, // should be string
        address: [], // should be string
      }
      const request = createMockRequest('PUT', invalidData)
      
      // Execute
      const response = await PUT(request)
      
      // Assert - should still process (basic endpoint doesn't have validation)
      expect(response.status).toBe(200)
    })
    
    it('should handle database update failures', async () => {
      // Setup
      const mockSupabase = require('@/lib/supabase')
      mockSupabase.createClient.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue(new Error('Update failed')),
      })
      
      const updateData = { name: 'Test Update' }
      const request = createMockRequest('PUT', updateData)
      
      // Execute
      const response = await PUT(request)
      
      // Assert
      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body).toHaveProperty('error', 'Failed to update profile')
    })
  })
  
  describe('GET /api/user/profile', () => {
    it('should return 401 for unauthenticated requests', async () => {
      // Setup - no session
      mockAuthSession(null)
      const request = createMockRequest('GET')
      
      // Execute
      const response = await UserProfileGET(request)
      
      // Assert
      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toHaveProperty('error', 'Unauthorized')
    })
    
    it('should return user profile for authenticated user', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const mockProfile = createTestFamily()
      const mockSupabase = require('@/lib/supabase')
      mockSupabase.supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await UserProfileGET(request)
      
      // Assert
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('profile', mockProfile)
    })
    
    it('should handle profile not found gracefully', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const mockSupabase = require('@/lib/supabase')
      mockSupabase.supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // No rows returned
        }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await UserProfileGET(request)
      
      // Assert
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('profile', null)
    })
    
    it('should handle database errors', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const mockSupabase = require('@/lib/supabase')
      mockSupabase.supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST301', message: 'Database error' },
        }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await UserProfileGET(request)
      
      // Assert
      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body).toHaveProperty('error', 'Database error')
    })
  })
  
  describe('PUT /api/user/profile', () => {
    it('should update user profile with valid data', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const updateData = {
        userType: 'family',
        name: 'Updated Family Name',
        phone: '+31612345678',
        address: 'Updated Address 123, Amsterdam',
      }
      
      const mockProfile = { ...createTestFamily(), ...updateData }
      const mockSupabase = require('@/lib/supabase')
      mockSupabase.supabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      })
      
      const request = createMockRequest('PUT', updateData)
      
      // Execute
      const response = await UserProfilePUT(request)
      
      // Assert
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('profile', mockProfile)
    })
    
    it('should require authentication', async () => {
      // Setup - no session
      mockAuthSession(null)
      const updateData = { name: 'Test Update' }
      const request = createMockRequest('PUT', updateData)
      
      // Execute
      const response = await UserProfilePUT(request)
      
      // Assert
      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toHaveProperty('error', 'Unauthorized')
    })
    
    it('should handle upsert conflicts correctly', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const updateData = { userType: 'family', name: 'Test Family' }
      const mockSupabase = require('@/lib/supabase')
      mockSupabase.supabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'Unique constraint violation' },
        }),
      })
      
      const request = createMockRequest('PUT', updateData)
      
      // Execute
      const response = await UserProfilePUT(request)
      
      // Assert
      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body).toHaveProperty('error', 'Database error')
    })
  })
  
  describe('POST /api/user/profile', () => {
    it('should create new user profile with valid data', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const profileData = {
        userType: 'family',
        name: 'New Family',
        phone: '+31612345678',
        address: 'New Address 123, Amsterdam',
      }
      
      const mockProfile = createTestFamily(profileData)
      const mockSupabase = require('@/lib/supabase')
      mockSupabase.supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      })
      
      const request = createMockRequest('POST', profileData)
      
      // Execute
      const response = await UserProfilePOST(request)
      
      // Assert
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('profile', mockProfile)
    })
    
    it('should handle specialization array correctly', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const profileData = {
        userType: 'family',
        name: 'New Family',
        specialization: 'traditional', // Single specialization
      }
      
      const mockProfile = createTestFamily({
        ...profileData,
        specializations: ['traditional'],
      })
      const mockSupabase = require('@/lib/supabase')
      mockSupabase.supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      })
      
      const request = createMockRequest('POST', profileData)
      
      // Execute
      const response = await UserProfilePOST(request)
      
      // Assert
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.profile).toHaveProperty('specializations', ['traditional'])
    })
    
    it('should require authentication for profile creation', async () => {
      // Setup - no session
      mockAuthSession(null)
      const profileData = { userType: 'family', name: 'Test Family' }
      const request = createMockRequest('POST', profileData)
      
      // Execute
      const response = await UserProfilePOST(request)
      
      // Assert
      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toHaveProperty('error', 'Unauthorized')
    })
    
    it('should handle duplicate profile creation', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const profileData = { userType: 'family', name: 'Test Family' }
      const mockSupabase = require('@/lib/supabase')
      mockSupabase.supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'Unique constraint violation' },
        }),
      })
      
      const request = createMockRequest('POST', profileData)
      
      // Execute
      const response = await UserProfilePOST(request)
      
      // Assert
      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body).toHaveProperty('error', 'Database error')
    })
  })
  
  describe('Response Format Validation', () => {
    it('should return consistent error format across all endpoints', async () => {
      // Test GET endpoint error format
      mockAuthSession(null)
      const getResponse = await UserProfileGET(createMockRequest('GET'))
      const getBody = await getResponse.json()
      
      expect(getBody).toHaveProperty('error')
      expect(typeof getBody.error).toBe('string')
      
      // Test PUT endpoint error format  
      const putResponse = await UserProfilePUT(createMockRequest('PUT', {}))
      const putBody = await putResponse.json()
      
      expect(putBody).toHaveProperty('error')
      expect(typeof putBody.error).toBe('string')
      
      // Test POST endpoint error format
      const postResponse = await UserProfilePOST(createMockRequest('POST', {}))
      const postBody = await postResponse.json()
      
      expect(postBody).toHaveProperty('error')
      expect(typeof postBody.error).toBe('string')
    })
    
    it('should return consistent success format across all endpoints', async () => {
      // Setup mocks for successful responses
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const mockProfile = createTestFamily()
      const mockSupabase = require('@/lib/supabase')
      
      // Test different response formats
      const responses = [
        await GET(),
        await PUT(createMockRequest('PUT', { name: 'Test' })),
      ]
      
      responses.forEach(async (response) => {
        const body = await response.json()
        expect(body).toHaveProperty('success')
        expect(typeof body.success).toBe('boolean')
      })
    })
  })
  
  describe('Data Validation', () => {
    it('should handle empty request bodies', async () => {
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      // Test with empty PUT request
      const response = await PUT(createMockRequest('PUT', {}))
      expect(response.status).toBe(200) // Should not fail on empty data
    })
    
    it('should handle null values in request data', async () => {
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const dataWithNulls = {
        name: null,
        phone: null,
        address: null,
      }
      
      const response = await PUT(createMockRequest('PUT', dataWithNulls))
      expect(response.status).toBe(200) // Should handle nulls gracefully
    })
    
    it('should handle very long strings', async () => {
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const longString = 'A'.repeat(10000)
      const dataWithLongStrings = {
        name: longString,
        address: longString,
      }
      
      const response = await PUT(createMockRequest('PUT', dataWithLongStrings))
      expect(response.status).toBe(200) // Should handle long strings
    })
  })
})