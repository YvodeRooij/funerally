/**
 * NextAuth Integration Tests
 * 
 * Comprehensive tests for all authentication providers, session management,
 * and NextAuth configuration for Farewelly application.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextAuthOptions } from 'next-auth'
import { Session } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types/next-auth'
import { compare } from 'bcryptjs'

// Mock NextAuth dependencies
jest.mock('next-auth/providers/google')
jest.mock('next-auth/providers/facebook')
jest.mock('next-auth/providers/credentials')
jest.mock('bcryptjs')

describe('NextAuth Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
    process.env.FACEBOOK_CLIENT_ID = 'test-facebook-client-id'
    process.env.FACEBOOK_CLIENT_SECRET = 'test-facebook-client-secret'
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Authentication Configuration', () => {
    it('should have correct provider configuration', () => {
      expect(authOptions.providers).toHaveLength(3)
      expect(authOptions.providers[0]).toHaveProperty('id', 'google')
      expect(authOptions.providers[1]).toHaveProperty('id', 'facebook')
      expect(authOptions.providers[2]).toHaveProperty('id', 'credentials')
    })

    it('should have correct session configuration', () => {
      expect(authOptions.session?.strategy).toBe('jwt')
      expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60) // 30 days
    })

    it('should have correct JWT configuration', () => {
      expect(authOptions.jwt?.maxAge).toBe(30 * 24 * 60 * 60) // 30 days
    })

    it('should have correct page configuration', () => {
      expect(authOptions.pages?.signIn).toBe('/auth/signin')
      expect(authOptions.pages?.newUser).toBe('/auth/onboarding')
      expect(authOptions.pages?.error).toBe('/auth/error')
    })
  })

  describe('Google OAuth Provider', () => {
    it('should be configured with correct client credentials', () => {
      const googleProvider = authOptions.providers.find(p => p.id === 'google')
      expect(googleProvider).toBeDefined()
      expect(googleProvider?.options?.clientId).toBe(process.env.GOOGLE_CLIENT_ID)
      expect(googleProvider?.options?.clientSecret).toBe(process.env.GOOGLE_CLIENT_SECRET)
    })

    it('should have correct authorization parameters', () => {
      const googleProvider = authOptions.providers.find(p => p.id === 'google')
      expect(googleProvider?.authorization).toEqual({
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      })
    })

    it('should handle Google sign-in flow', async () => {
      const signInCallback = authOptions.callbacks?.signIn
      expect(signInCallback).toBeDefined()

      const result = await signInCallback?.({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        account: { provider: 'google', type: 'oauth' },
        profile: {},
        email: { verificationRequest: false }
      })

      expect(result).toBe(true)
    })
  })

  describe('Facebook OAuth Provider', () => {
    it('should be configured with correct client credentials', () => {
      const facebookProvider = authOptions.providers.find(p => p.id === 'facebook')
      expect(facebookProvider).toBeDefined()
      expect(facebookProvider?.options?.clientId).toBe(process.env.FACEBOOK_CLIENT_ID)
      expect(facebookProvider?.options?.clientSecret).toBe(process.env.FACEBOOK_CLIENT_SECRET)
    })

    it('should have correct authorization parameters', () => {
      const facebookProvider = authOptions.providers.find(p => p.id === 'facebook')
      expect(facebookProvider?.authorization).toEqual({
        params: {
          scope: 'email'
        }
      })
    })

    it('should handle Facebook sign-in flow', async () => {
      const signInCallback = authOptions.callbacks?.signIn
      expect(signInCallback).toBeDefined()

      const result = await signInCallback?.({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        account: { provider: 'facebook', type: 'oauth' },
        profile: {},
        email: { verificationRequest: false }
      })

      expect(result).toBe(true)
    })
  })

  describe('Credentials Provider', () => {
    beforeEach(() => {
      (compare as jest.MockedFunction<typeof compare>).mockResolvedValue(true)
    })

    it('should be configured with correct fields', () => {
      const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials')
      expect(credentialsProvider).toBeDefined()
      expect(credentialsProvider?.credentials).toEqual({
        email: { 
          label: 'Email', 
          type: 'email', 
          placeholder: 'Enter your email' 
        },
        password: { 
          label: 'Password', 
          type: 'password', 
          placeholder: 'Enter your password' 
        }
      })
    })

    it('should authenticate valid credentials', async () => {
      const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials')
      const authorize = credentialsProvider?.authorize

      const result = await authorize?.({
        email: 'admin@farewelly.com',
        password: 'admin123'
      })

      expect(result).toEqual({
        id: '1',
        email: 'admin@farewelly.com',
        name: 'Admin User',
        userType: 'admin',
        role: 'admin',
        permissions: ['*']
      })
    })

    it('should reject invalid email', async () => {
      const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials')
      const authorize = credentialsProvider?.authorize

      await expect(authorize?.({
        email: 'invalid@example.com',
        password: 'admin123'
      })).rejects.toThrow('Invalid email or password')
    })

    it('should reject invalid password', async () => {
      (compare as jest.MockedFunction<typeof compare>).mockResolvedValue(false)

      const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials')
      const authorize = credentialsProvider?.authorize

      await expect(authorize?.({
        email: 'admin@farewelly.com',
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid email or password')
    })

    it('should reject missing credentials', async () => {
      const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials')
      const authorize = credentialsProvider?.authorize

      await expect(authorize?.({})).rejects.toThrow('Email and password are required')
    })
  })

  describe('JWT Callback', () => {
    it('should handle initial sign-in', async () => {
      const jwtCallback = authOptions.callbacks?.jwt
      
      const token = await jwtCallback?.({
        token: {},
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          userType: 'family' as UserRole,
          role: 'family' as UserRole,
          permissions: ['view_services', 'create_booking']
        },
        account: { provider: 'google', type: 'oauth' }
      })

      expect(token).toEqual({
        userType: 'family',
        role: 'family',
        isNewUser: false,
        userId: '1',
        permissions: ['view_services', 'create_booking']
      })
    })

    it('should handle new user sign-in', async () => {
      const jwtCallback = authOptions.callbacks?.jwt
      
      const token = await jwtCallback?.({
        token: {},
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        },
        account: { provider: 'google', type: 'oauth' }
      })

      expect(token).toEqual({
        userType: null,
        role: null,
        isNewUser: true,
        userId: '1',
        permissions: []
      })
    })

    it('should handle session update', async () => {
      const jwtCallback = authOptions.callbacks?.jwt
      
      const token = await jwtCallback?.({
        token: { userType: 'family', role: 'family' },
        trigger: 'update',
        session: {
          userType: 'director' as UserRole,
          role: 'director' as UserRole,
          permissions: ['manage_services', 'view_clients']
        }
      })

      expect(token).toEqual({
        userType: 'director',
        role: 'director',
        permissions: ['manage_services', 'view_clients']
      })
    })
  })

  describe('Session Callback', () => {
    it('should populate session with user data', async () => {
      const sessionCallback = authOptions.callbacks?.session
      
      const session = await sessionCallback?.({
        session: {
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          expires: '2024-12-31'
        } as Session,
        token: {
          userType: 'family' as UserRole,
          role: 'family' as UserRole,
          isNewUser: false,
          userId: '1',
          permissions: ['view_services', 'create_booking']
        } as JWT
      })

      expect(session.user).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        userType: 'family',
        role: 'family',
        isNewUser: false,
        userId: '1',
        permissions: ['view_services', 'create_booking']
      })
    })
  })

  describe('Redirect Callback', () => {
    it('should redirect to onboarding for new users', async () => {
      const redirectCallback = authOptions.callbacks?.redirect
      
      const url = await redirectCallback?.({
        url: 'http://localhost:3000/auth/onboarding',
        baseUrl: 'http://localhost:3000'
      })

      expect(url).toBe('http://localhost:3000/auth/onboarding')
    })

    it('should redirect to dashboard after sign-in', async () => {
      const redirectCallback = authOptions.callbacks?.redirect
      
      const url = await redirectCallback?.({
        url: 'http://localhost:3000',
        baseUrl: 'http://localhost:3000'
      })

      expect(url).toBe('http://localhost:3000/dashboard')
    })

    it('should preserve valid callback URLs', async () => {
      const redirectCallback = authOptions.callbacks?.redirect
      
      const url = await redirectCallback?.({
        url: 'http://localhost:3000/family',
        baseUrl: 'http://localhost:3000'
      })

      expect(url).toBe('http://localhost:3000/family')
    })

    it('should reject invalid callback URLs', async () => {
      const redirectCallback = authOptions.callbacks?.redirect
      
      const url = await redirectCallback?.({
        url: 'http://malicious-site.com',
        baseUrl: 'http://localhost:3000'
      })

      expect(url).toBe('http://localhost:3000')
    })
  })

  describe('Event Handlers', () => {
    it('should log sign-in events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await authOptions.events?.signIn?.({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        account: { provider: 'google', type: 'oauth' },
        profile: {},
        isNewUser: false
      })

      expect(consoleSpy).toHaveBeenCalledWith('User signed in: test@example.com via google')
      consoleSpy.mockRestore()
    })

    it('should log new user events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await authOptions.events?.signIn?.({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        account: { provider: 'google', type: 'oauth' },
        profile: {},
        isNewUser: true
      })

      expect(consoleSpy).toHaveBeenCalledWith('User signed in: test@example.com via google')
      expect(consoleSpy).toHaveBeenCalledWith('New user signed up:', 'test@example.com')
      consoleSpy.mockRestore()
    })

    it('should log sign-out events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await authOptions.events?.signOut?.({
        session: {
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          expires: '2024-12-31'
        },
        token: {} as JWT
      })

      expect(consoleSpy).toHaveBeenCalledWith('User signed out:', 'test@example.com')
      consoleSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    it('should handle authorization errors', async () => {
      const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials')
      const authorize = credentialsProvider?.authorize

      await expect(authorize?.({
        email: '',
        password: ''
      })).rejects.toThrow('Email and password are required')
    })

    it('should handle database connection errors', async () => {
      // Mock database error
      (compare as jest.MockedFunction<typeof compare>).mockRejectedValue(new Error('Database connection failed'))

      const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials')
      const authorize = credentialsProvider?.authorize

      await expect(authorize?.({
        email: 'admin@farewelly.com',
        password: 'admin123'
      })).rejects.toThrow('Database connection failed')
    })
  })

  describe('Security Tests', () => {
    it('should not expose sensitive information in tokens', async () => {
      const jwtCallback = authOptions.callbacks?.jwt
      
      const token = await jwtCallback?.({
        token: {},
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          password: 'secret123', // This should not be included in token
          userType: 'family' as UserRole,
          role: 'family' as UserRole,
          permissions: ['view_services']
        },
        account: { provider: 'credentials', type: 'credentials' }
      })

      expect(token).not.toHaveProperty('password')
    })

    it('should validate token expiration', () => {
      expect(authOptions.jwt?.maxAge).toBeLessThanOrEqual(30 * 24 * 60 * 60)
      expect(authOptions.session?.maxAge).toBeLessThanOrEqual(30 * 24 * 60 * 60)
    })

    it('should use secure session strategy', () => {
      expect(authOptions.session?.strategy).toBe('jwt')
    })
  })
})