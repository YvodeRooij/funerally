/**
 * Mock Authentication Utilities
 * 
 * Utility functions and mocks for testing authentication flows,
 * session management, and user interactions in Farewelly tests.
 */

import { Session } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import { UserRole } from '@/types/next-auth'
import { NextRequest } from 'next/server'
import { ROLE_PERMISSIONS } from '@/lib/auth-utils'

/**
 * Mock Users Database
 */
export const mockUsers = {
  family: {
    id: '1',
    email: 'family@example.com',
    name: 'Family User',
    role: 'family' as UserRole,
    password: '$2a$12$hashedpassword123',
    permissions: ROLE_PERMISSIONS.family,
    createdAt: new Date('2024-01-01').toISOString(),
    isNewUser: false
  },
  venue: {
    id: '2',
    email: 'venue@example.com',
    name: 'Venue Manager',
    role: 'venue' as UserRole,
    password: '$2a$12$hashedpassword456',
    permissions: ROLE_PERMISSIONS.venue,
    createdAt: new Date('2024-01-02').toISOString(),
    isNewUser: false
  },
  director: {
    id: '3',
    email: 'director@example.com',
    name: 'Funeral Director',
    role: 'director' as UserRole,
    password: '$2a$12$hashedpassword789',
    permissions: ROLE_PERMISSIONS.director,
    createdAt: new Date('2024-01-03').toISOString(),
    isNewUser: false
  },
  admin: {
    id: '4',
    email: 'admin@example.com',
    name: 'System Admin',
    role: 'admin' as UserRole,
    password: '$2a$12$hashedpasswordabc',
    permissions: ROLE_PERMISSIONS.admin,
    createdAt: new Date('2024-01-04').toISOString(),
    isNewUser: false
  },
  newUser: {
    id: '5',
    email: 'newuser@example.com',
    name: 'New User',
    role: 'family' as UserRole,
    password: '$2a$12$hashedpassworddef',
    permissions: ROLE_PERMISSIONS.family,
    createdAt: new Date().toISOString(),
    isNewUser: true
  }
}

/**
 * Create Mock Session
 */
export function createMockSession(role: UserRole, overrides: Partial<Session> = {}): Session {
  const user = mockUsers[role] || mockUsers.family
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      userType: user.role,
      permissions: user.permissions,
      isNewUser: user.isNewUser,
      userId: user.id
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides
  }
}

/**
 * Create Mock JWT Token
 */
export function createMockJWT(role: UserRole, overrides: Partial<JWT> = {}): JWT {
  const user = mockUsers[role] || mockUsers.family
  
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    userType: user.role,
    permissions: user.permissions,
    isNewUser: user.isNewUser,
    userId: user.id,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    ...overrides
  }
}

/**
 * Create Mock NextAuth User
 */
export function createMockUser(role: UserRole, overrides: any = {}) {
  const user = mockUsers[role] || mockUsers.family
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    userType: user.role,
    permissions: user.permissions,
    isNewUser: user.isNewUser,
    ...overrides
  }
}

/**
 * Create Mock NextRequest
 */
export function createMockRequest(
  url: string, 
  options: {
    method?: string
    headers?: Record<string, string>
    body?: any
    cookies?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'GET', headers = {}, body, cookies = {} } = options
  
  // Add cookies to headers
  if (Object.keys(cookies).length > 0) {
    const cookieHeader = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')
    headers['Cookie'] = cookieHeader
  }
  
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined
  })
}

/**
 * Mock Authentication Provider
 */
export class MockAuthProvider {
  private sessions: Map<string, Session> = new Map()
  private tokens: Map<string, JWT> = new Map()
  
  constructor(initialSessions: Record<string, Session> = {}) {
    Object.entries(initialSessions).forEach(([key, session]) => {
      this.sessions.set(key, session)
    })
  }
  
  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessions.get(sessionId) || null
  }
  
  async setSession(sessionId: string, session: Session): Promise<void> {
    this.sessions.set(sessionId, session)
  }
  
  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId)
  }
  
  async getToken(tokenId: string): Promise<JWT | null> {
    return this.tokens.get(tokenId) || null
  }
  
  async setToken(tokenId: string, token: JWT): Promise<void> {
    this.tokens.set(tokenId, token)
  }
  
  async deleteToken(tokenId: string): Promise<void> {
    this.tokens.delete(tokenId)
  }
  
  clear(): void {
    this.sessions.clear()
    this.tokens.clear()
  }
  
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values())
  }
  
  getAllTokens(): JWT[] {
    return Array.from(this.tokens.values())
  }
}

/**
 * Mock OAuth Provider Response
 */
export function createMockOAuthProfile(provider: 'google' | 'facebook', overrides: any = {}) {
  const baseProfiles = {
    google: {
      sub: '1234567890',
      name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      picture: 'https://lh3.googleusercontent.com/test',
      email: 'test@gmail.com',
      email_verified: true,
      locale: 'en'
    },
    facebook: {
      id: '1234567890',
      name: 'Test User',
      email: 'test@facebook.com',
      picture: {
        data: {
          height: 50,
          is_silhouette: false,
          url: 'https://platform-lookaside.fbsbx.com/test',
          width: 50
        }
      }
    }
  }
  
  return {
    ...baseProfiles[provider],
    ...overrides
  }
}

/**
 * Mock Authentication Events
 */
export class MockAuthEvents {
  private events: Array<{ type: string; data: any; timestamp: number }> = []
  
  signIn(data: any): void {
    this.events.push({
      type: 'signIn',
      data,
      timestamp: Date.now()
    })
  }
  
  signOut(data: any): void {
    this.events.push({
      type: 'signOut',
      data,
      timestamp: Date.now()
    })
  }
  
  session(data: any): void {
    this.events.push({
      type: 'session',
      data,
      timestamp: Date.now()
    })
  }
  
  jwt(data: any): void {
    this.events.push({
      type: 'jwt',
      data,
      timestamp: Date.now()
    })
  }
  
  getEvents(type?: string): Array<{ type: string; data: any; timestamp: number }> {
    return type ? this.events.filter(event => event.type === type) : this.events
  }
  
  getLastEvent(type?: string): { type: string; data: any; timestamp: number } | null {
    const events = this.getEvents(type)
    return events.length > 0 ? events[events.length - 1] : null
  }
  
  clear(): void {
    this.events = []
  }
  
  count(type?: string): number {
    return this.getEvents(type).length
  }
}

/**
 * Mock Rate Limiter
 */
export class MockRateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map()
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isBlocked(key: string): boolean {
    const attempt = this.attempts.get(key)
    if (!attempt) return false
    
    // Reset if window has passed
    if (Date.now() > attempt.resetAt) {
      this.attempts.delete(key)
      return false
    }
    
    return attempt.count >= this.maxAttempts
  }
  
  increment(key: string): { blocked: boolean; attemptsLeft: number; resetAt: number } {
    const now = Date.now()
    let attempt = this.attempts.get(key)
    
    if (!attempt || now > attempt.resetAt) {
      attempt = { count: 0, resetAt: now + this.windowMs }
    }
    
    attempt.count++
    this.attempts.set(key, attempt)
    
    return {
      blocked: attempt.count >= this.maxAttempts,
      attemptsLeft: Math.max(0, this.maxAttempts - attempt.count),
      resetAt: attempt.resetAt
    }
  }
  
  reset(key: string): void {
    this.attempts.delete(key)
  }
  
  clear(): void {
    this.attempts.clear()
  }
  
  getAttemptCount(key: string): number {
    const attempt = this.attempts.get(key)
    return attempt ? attempt.count : 0
  }
}

/**
 * Mock CSRF Token Manager
 */
export class MockCSRFTokenManager {
  private tokens: Map<string, { token: string; createdAt: number; used: boolean }> = new Map()
  
  constructor(private tokenLifetime: number = 60 * 60 * 1000) {} // 1 hour
  
  generateToken(sessionId: string): string {
    const token = this.randomToken()
    this.tokens.set(sessionId, {
      token,
      createdAt: Date.now(),
      used: false
    })
    return token
  }
  
  validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId)
    if (!stored) return false
    
    // Check if token has expired
    if (Date.now() - stored.createdAt > this.tokenLifetime) {
      this.tokens.delete(sessionId)
      return false
    }
    
    // Check if token matches and hasn't been used
    if (stored.token === token && !stored.used) {
      stored.used = true // Mark as used
      return true
    }
    
    return false
  }
  
  revokeToken(sessionId: string): void {
    this.tokens.delete(sessionId)
  }
  
  clear(): void {
    this.tokens.clear()
  }
  
  private randomToken(): string {
    return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
  }
}

/**
 * Mock Password Utilities
 */
export class MockPasswordUtils {
  static readonly MIN_LENGTH = 8
  static readonly COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  
  static validateStrength(password: string): {
    isValid: boolean
    errors: string[]
    score: number
  } {
    const errors: string[] = []
    let score = 0
    
    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`)
    } else {
      score += 20
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    } else {
      score += 20
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    } else {
      score += 20
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    } else {
      score += 20
    }
    
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character')
    } else {
      score += 20
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      score
    }
  }
  
  static async hash(password: string): Promise<string> {
    // Mock hash function
    return `$2a$12$${Buffer.from(password).toString('base64')}`
  }
  
  static async compare(password: string, hash: string): Promise<boolean> {
    const expectedHash = await this.hash(password)
    return hash === expectedHash
  }
}

/**
 * Test Assertion Helpers
 */
export const authAssertions = {
  expectAuthenticated(session: Session | null): void {
    expect(session).toBeDefined()
    expect(session?.user).toBeDefined()
    expect(session?.user?.id).toBeDefined()
    expect(session?.user?.email).toBeDefined()
  },
  
  expectUnauthenticated(session: Session | null): void {
    expect(session).toBeNull()
  },
  
  expectRole(session: Session | null, expectedRole: UserRole): void {
    this.expectAuthenticated(session)
    expect(session?.user?.role).toBe(expectedRole)
  },
  
  expectPermission(session: Session | null, permission: string): void {
    this.expectAuthenticated(session)
    expect(session?.user?.permissions).toContain(permission)
  },
  
  expectNoPermission(session: Session | null, permission: string): void {
    this.expectAuthenticated(session)
    expect(session?.user?.permissions).not.toContain(permission)
  },
  
  expectNewUser(session: Session | null): void {
    this.expectAuthenticated(session)
    expect(session?.user?.isNewUser).toBe(true)
  },
  
  expectExistingUser(session: Session | null): void {
    this.expectAuthenticated(session)
    expect(session?.user?.isNewUser).toBe(false)
  }
}

/**
 * Test Data Generators
 */
export const testDataGenerators = {
  randomEmail(): string {
    return `test${Date.now()}@example.com`
  },
  
  randomPassword(): string {
    return `Test${Math.random().toString(36).substring(2)}!123`
  },
  
  randomName(): string {
    const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana']
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia']
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    return `${firstName} ${lastName}`
  },
  
  randomRole(): UserRole {
    const roles: UserRole[] = ['family', 'venue', 'director', 'admin']
    return roles[Math.floor(Math.random() * roles.length)]
  },
  
  createTestUser(overrides: any = {}) {
    return {
      id: Math.random().toString(36).substring(2),
      email: this.randomEmail(),
      name: this.randomName(),
      role: this.randomRole(),
      password: this.randomPassword(),
      createdAt: new Date().toISOString(),
      isNewUser: false,
      ...overrides
    }
  }
}

/**
 * Export all utilities
 */
export default {
  mockUsers,
  createMockSession,
  createMockJWT,
  createMockUser,
  createMockRequest,
  createMockOAuthProfile,
  MockAuthProvider,
  MockAuthEvents,
  MockRateLimiter,
  MockCSRFTokenManager,
  MockPasswordUtils,
  authAssertions,
  testDataGenerators
}