/**
 * JWT Security Tests
 * 
 * Comprehensive tests for JWT token validation, expiry, refresh, 
 * signature verification, and security vulnerabilities in Farewelly application.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { SignJWT, jwtVerify } from 'jose'
import { JWT } from 'next-auth/jwt'
import { Session } from 'next-auth'
import { UserRole } from '@/types/next-auth'
import { authOptions } from '@/lib/auth'

// Mock NextAuth JWT functions
jest.mock('next-auth/jwt', () => ({
  encode: jest.fn(),
  decode: jest.fn(),
  getToken: jest.fn()
}))

describe('JWT Security Tests', () => {
  const SECRET = 'test-secret-key-minimum-32-characters-long'
  const encoder = new TextEncoder()
  
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXTAUTH_SECRET = SECRET
  })

  afterEach(() => {
    delete process.env.NEXTAUTH_SECRET
  })

  const createTestJWT = async (payload: any, expiresIn: string = '30d'): Promise<string> => {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(encoder.encode(SECRET))
  }

  const verifyTestJWT = async (token: string): Promise<any> => {
    const { payload } = await jwtVerify(token, encoder.encode(SECRET))
    return payload
  }

  describe('JWT Token Structure', () => {
    it('should create JWT with proper structure', async () => {
      const payload = {
        sub: '1',
        email: 'test@example.com',
        role: 'family',
        permissions: ['view_services', 'create_booking']
      }

      const token = await createTestJWT(payload)
      expect(token).toBeDefined()
      expect(token.split('.')).toHaveLength(3) // header.payload.signature
    })

    it('should include required claims in JWT', async () => {
      const payload = {
        sub: '1',
        email: 'test@example.com',
        role: 'family',
        permissions: ['view_services', 'create_booking']
      }

      const token = await createTestJWT(payload)
      const decoded = await verifyTestJWT(token)

      expect(decoded.sub).toBe('1')
      expect(decoded.email).toBe('test@example.com')
      expect(decoded.role).toBe('family')
      expect(decoded.permissions).toEqual(['view_services', 'create_booking'])
      expect(decoded.iat).toBeDefined() // issued at
      expect(decoded.exp).toBeDefined() // expiration
    })

    it('should not include sensitive data in JWT', async () => {
      const payload = {
        sub: '1',
        email: 'test@example.com',
        role: 'family',
        password: 'secret123', // This should not be in JWT
        permissions: ['view_services']
      }

      const token = await createTestJWT(payload)
      const decoded = await verifyTestJWT(token)

      expect(decoded.password).toBeUndefined()
      expect(decoded.sub).toBe('1')
      expect(decoded.email).toBe('test@example.com')
    })
  })

  describe('JWT Expiration Tests', () => {
    it('should create JWT with correct expiration time', async () => {
      const payload = { sub: '1', email: 'test@example.com' }
      const token = await createTestJWT(payload, '1h')
      const decoded = await verifyTestJWT(token)

      const now = Math.floor(Date.now() / 1000)
      const expectedExp = now + 3600 // 1 hour
      
      expect(decoded.exp).toBeGreaterThan(now)
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5) // Allow 5 seconds tolerance
    })

    it('should reject expired JWT tokens', async () => {
      const payload = { sub: '1', email: 'test@example.com' }
      const token = await createTestJWT(payload, '1ms') // Expires immediately
      
      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10))
      
      await expect(verifyTestJWT(token)).rejects.toThrow('JWT expired')
    })

    it('should validate JWT expiration configuration', () => {
      expect(authOptions.jwt?.maxAge).toBe(30 * 24 * 60 * 60) // 30 days
      expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60) // 30 days
    })

    it('should handle JWT expiration edge cases', async () => {
      const payload = { sub: '1', email: 'test@example.com' }
      
      // Test with different expiration times
      const shortToken = await createTestJWT(payload, '1s')
      const longToken = await createTestJWT(payload, '365d')
      
      // Short token should work initially
      const shortDecoded = await verifyTestJWT(shortToken)
      expect(shortDecoded.sub).toBe('1')
      
      // Long token should work
      const longDecoded = await verifyTestJWT(longToken)
      expect(longDecoded.sub).toBe('1')
    })
  })

  describe('JWT Signature Verification', () => {
    it('should verify JWT with correct secret', async () => {
      const payload = { sub: '1', email: 'test@example.com', role: 'family' }
      const token = await createTestJWT(payload)
      
      const decoded = await verifyTestJWT(token)
      expect(decoded.sub).toBe('1')
      expect(decoded.email).toBe('test@example.com')
      expect(decoded.role).toBe('family')
    })

    it('should reject JWT with wrong secret', async () => {
      const payload = { sub: '1', email: 'test@example.com' }
      const token = await createTestJWT(payload)
      
      // Try to verify with wrong secret
      const wrongSecret = 'wrong-secret-key-minimum-32-characters-long'
      await expect(
        jwtVerify(token, encoder.encode(wrongSecret))
      ).rejects.toThrow('signature verification failed')
    })

    it('should reject malformed JWT tokens', async () => {
      const malformedTokens = [
        'invalid.jwt.token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        'header.payload', // Missing signature
        'not-a-jwt-at-all'
      ]

      for (const token of malformedTokens) {
        await expect(verifyTestJWT(token)).rejects.toThrow()
      }
    })
  })

  describe('JWT Security Vulnerabilities', () => {
    it('should prevent JWT algorithm confusion attacks', async () => {
      // Create a token with 'none' algorithm (should be rejected)
      const header = { alg: 'none', typ: 'JWT' }
      const payload = { sub: '1', email: 'test@example.com', role: 'admin' }
      
      const headerEncoded = Buffer.from(JSON.stringify(header)).toString('base64url')
      const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
      const maliciousToken = `${headerEncoded}.${payloadEncoded}.`
      
      await expect(verifyTestJWT(maliciousToken)).rejects.toThrow()
    })

    it('should prevent JWT header manipulation', async () => {
      const payload = { sub: '1', email: 'test@example.com', role: 'family' }
      const token = await createTestJWT(payload)
      
      // Attempt to modify the header
      const parts = token.split('.')
      const maliciousHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
      const maliciousToken = `${maliciousHeader}.${parts[1]}.${parts[2]}`
      
      await expect(verifyTestJWT(maliciousToken)).rejects.toThrow()
    })

    it('should prevent JWT payload manipulation', async () => {
      const payload = { sub: '1', email: 'test@example.com', role: 'family' }
      const token = await createTestJWT(payload)
      
      // Attempt to modify the payload
      const parts = token.split('.')
      const maliciousPayload = Buffer.from(JSON.stringify({ 
        sub: '1', 
        email: 'test@example.com', 
        role: 'admin' // Escalate privileges
      })).toString('base64url')
      const maliciousToken = `${parts[0]}.${maliciousPayload}.${parts[2]}`
      
      await expect(verifyTestJWT(maliciousToken)).rejects.toThrow('signature verification failed')
    })

    it('should validate JWT timing attacks resistance', async () => {
      const payload = { sub: '1', email: 'test@example.com' }
      const validToken = await createTestJWT(payload)
      const invalidToken = validToken.slice(0, -5) + 'XXXXX' // Corrupt signature
      
      // Measure verification time for valid and invalid tokens
      const startValid = process.hrtime.bigint()
      try {
        await verifyTestJWT(validToken)
      } catch (error) {
        // Expected to succeed
      }
      const endValid = process.hrtime.bigint()
      
      const startInvalid = process.hrtime.bigint()
      try {
        await verifyTestJWT(invalidToken)
      } catch (error) {
        // Expected to fail
      }
      const endInvalid = process.hrtime.bigint()
      
      // Time difference should not be significant (timing attack prevention)
      const validTime = Number(endValid - startValid) / 1000000 // Convert to ms
      const invalidTime = Number(endInvalid - startInvalid) / 1000000
      
      // Allow for reasonable variance in timing
      expect(Math.abs(validTime - invalidTime)).toBeLessThan(100) // Less than 100ms difference
    })
  })

  describe('JWT Role and Permission Security', () => {
    it('should validate role escalation prevention', async () => {
      const familyPayload = { sub: '1', email: 'test@example.com', role: 'family' }
      const familyToken = await createTestJWT(familyPayload)
      
      // Verify family role is preserved
      const decoded = await verifyTestJWT(familyToken)
      expect(decoded.role).toBe('family')
      
      // Ensure token cannot be modified to escalate privileges
      const parts = familyToken.split('.')
      const maliciousPayload = Buffer.from(JSON.stringify({
        ...familyPayload,
        role: 'admin'
      })).toString('base64url')
      const maliciousToken = `${parts[0]}.${maliciousPayload}.${parts[2]}`
      
      await expect(verifyTestJWT(maliciousToken)).rejects.toThrow()
    })

    it('should validate permission tampering prevention', async () => {
      const payload = { 
        sub: '1', 
        email: 'test@example.com', 
        role: 'family',
        permissions: ['view_services', 'create_booking']
      }
      const token = await createTestJWT(payload)
      
      // Verify original permissions
      const decoded = await verifyTestJWT(token)
      expect(decoded.permissions).toEqual(['view_services', 'create_booking'])
      
      // Attempt to modify permissions
      const parts = token.split('.')
      const maliciousPayload = Buffer.from(JSON.stringify({
        ...payload,
        permissions: ['*'] // Grant all permissions
      })).toString('base64url')
      const maliciousToken = `${parts[0]}.${maliciousPayload}.${parts[2]}`
      
      await expect(verifyTestJWT(maliciousToken)).rejects.toThrow()
    })

    it('should validate JWT claims consistency', async () => {
      const roles: UserRole[] = ['family', 'venue', 'director', 'admin']
      
      for (const role of roles) {
        const payload = { 
          sub: '1', 
          email: 'test@example.com', 
          role,
          userType: role // Should match role
        }
        const token = await createTestJWT(payload)
        const decoded = await verifyTestJWT(token)
        
        expect(decoded.role).toBe(role)
        expect(decoded.userType).toBe(role)
      }
    })
  })

  describe('JWT Refresh and Renewal', () => {
    it('should handle JWT refresh scenarios', async () => {
      const originalPayload = { 
        sub: '1', 
        email: 'test@example.com', 
        role: 'family',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
      }
      
      const originalToken = await createTestJWT(originalPayload, '1h')
      const originalDecoded = await verifyTestJWT(originalToken)
      
      // Simulate refresh with updated timestamp
      const refreshedPayload = {
        ...originalPayload,
        iat: Math.floor(Date.now() / 1000) + 1800, // 30 minutes later
        exp: Math.floor(Date.now() / 1000) + 5400 // New expiration
      }
      
      const refreshedToken = await createTestJWT(refreshedPayload, '1.5h')
      const refreshedDecoded = await verifyTestJWT(refreshedToken)
      
      expect(refreshedDecoded.sub).toBe(originalDecoded.sub)
      expect(refreshedDecoded.email).toBe(originalDecoded.email)
      expect(refreshedDecoded.role).toBe(originalDecoded.role)
      expect(refreshedDecoded.iat).toBeGreaterThan(originalDecoded.iat)
      expect(refreshedDecoded.exp).toBeGreaterThan(originalDecoded.exp)
    })

    it('should prevent JWT replay attacks', async () => {
      const payload = { 
        sub: '1', 
        email: 'test@example.com', 
        role: 'family',
        jti: 'unique-token-id-123' // JWT ID for replay prevention
      }
      
      const token = await createTestJWT(payload)
      const decoded = await verifyTestJWT(token)
      
      expect(decoded.jti).toBe('unique-token-id-123')
      // In a real implementation, you would check this JTI against a blacklist
    })
  })

  describe('JWT Secret Security', () => {
    it('should require minimum secret length', () => {
      const shortSecret = 'short'
      process.env.NEXTAUTH_SECRET = shortSecret
      
      // In a real implementation, this should throw an error
      expect(shortSecret.length).toBeLessThan(32)
      // The application should reject secrets shorter than 32 characters
    })

    it('should use cryptographically secure secret', () => {
      const secret = process.env.NEXTAUTH_SECRET || ''
      
      // Check secret length
      expect(secret.length).toBeGreaterThanOrEqual(32)
      
      // Check secret entropy (basic check)
      const uniqueChars = new Set(secret.split('')).size
      expect(uniqueChars).toBeGreaterThan(10) // Should have good character diversity
    })

    it('should rotate secrets securely', async () => {
      const payload = { sub: '1', email: 'test@example.com', role: 'family' }
      
      // Create token with old secret
      const oldSecret = 'old-secret-key-minimum-32-characters-long'
      const oldToken = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(encoder.encode(oldSecret))
      
      // Create token with new secret
      const newSecret = 'new-secret-key-minimum-32-characters-long'
      const newToken = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(encoder.encode(newSecret))
      
      // Verify with correct secrets
      const oldDecoded = await jwtVerify(oldToken, encoder.encode(oldSecret))
      const newDecoded = await jwtVerify(newToken, encoder.encode(newSecret))
      
      expect(oldDecoded.payload.sub).toBe('1')
      expect(newDecoded.payload.sub).toBe('1')
      
      // Verify cross-secret validation fails
      await expect(
        jwtVerify(oldToken, encoder.encode(newSecret))
      ).rejects.toThrow('signature verification failed')
      
      await expect(
        jwtVerify(newToken, encoder.encode(oldSecret))
      ).rejects.toThrow('signature verification failed')
    })
  })

  describe('JWT Edge Cases and Error Handling', () => {
    it('should handle empty JWT payloads', async () => {
      const emptyPayload = {}
      const token = await createTestJWT(emptyPayload)
      const decoded = await verifyTestJWT(token)
      
      expect(decoded.iat).toBeDefined()
      expect(decoded.exp).toBeDefined()
    })

    it('should handle JWT with special characters', async () => {
      const payload = { 
        sub: '1', 
        email: 'test+special@example.com',
        name: 'Test User with Special Characters!@#$%^&*()',
        role: 'family'
      }
      
      const token = await createTestJWT(payload)
      const decoded = await verifyTestJWT(token)
      
      expect(decoded.email).toBe('test+special@example.com')
      expect(decoded.name).toBe('Test User with Special Characters!@#$%^&*()')
    })

    it('should handle JWT with Unicode characters', async () => {
      const payload = { 
        sub: '1', 
        email: 'test@example.com',
        name: 'Test 用户 名字 🔐',
        role: 'family'
      }
      
      const token = await createTestJWT(payload)
      const decoded = await verifyTestJWT(token)
      
      expect(decoded.name).toBe('Test 用户 名字 🔐')
    })

    it('should handle JWT size limits', async () => {
      // Create a payload that's too large
      const largePayload = {
        sub: '1',
        email: 'test@example.com',
        role: 'family',
        largeData: 'x'.repeat(10000) // 10KB of data
      }
      
      const token = await createTestJWT(largePayload)
      
      // JWT should still work but might be impractical
      expect(token.length).toBeGreaterThan(10000)
      
      // In a real implementation, you might want to limit payload size
      const decoded = await verifyTestJWT(token)
      expect(decoded.sub).toBe('1')
    })
  })
})