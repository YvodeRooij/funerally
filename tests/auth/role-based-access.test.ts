/**
 * Role-Based Access Control Tests
 * 
 * Comprehensive tests for all 4 user roles (family, director, venue, admin)
 * and their permission validation in the Farewelly application.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { Session } from 'next-auth'
import { UserRole } from '@/types/next-auth'
import {
  hasRole,
  hasPermission,
  canAccessResource,
  getRoleLevel,
  hasRoleAuthority,
  canManageUser,
  canAssignRole,
  getRouteAccess,
  ROLE_PERMISSIONS,
  RESOURCE_ACCESS,
  ROLE_HIERARCHY
} from '@/lib/auth-utils'

describe('Role-Based Access Control Tests', () => {
  let mockSession: Session

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockSession = (role: UserRole, permissions?: string[]): Session => ({
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role,
      permissions: permissions || ROLE_PERMISSIONS[role]
    },
    expires: '2024-12-31'
  })

  describe('Role Hierarchy Tests', () => {
    it('should have correct role hierarchy order', () => {
      expect(ROLE_HIERARCHY).toEqual(['family', 'venue', 'director', 'admin'])
      expect(getRoleLevel('family')).toBe(0)
      expect(getRoleLevel('venue')).toBe(1)
      expect(getRoleLevel('director')).toBe(2)
      expect(getRoleLevel('admin')).toBe(3)
    })

    it('should validate role authority correctly', () => {
      expect(hasRoleAuthority('admin', 'family')).toBe(true)
      expect(hasRoleAuthority('admin', 'director')).toBe(true)
      expect(hasRoleAuthority('director', 'venue')).toBe(true)
      expect(hasRoleAuthority('director', 'family')).toBe(true)
      expect(hasRoleAuthority('venue', 'family')).toBe(true)
      expect(hasRoleAuthority('family', 'venue')).toBe(false)
      expect(hasRoleAuthority('venue', 'director')).toBe(false)
    })
  })

  describe('Family User Role Tests', () => {
    beforeEach(() => {
      mockSession = createMockSession('family')
    })

    it('should have correct family permissions', () => {
      expect(ROLE_PERMISSIONS.family).toEqual([
        'view_services',
        'create_booking',
        'manage_profile',
        'view_memorials',
        'manage_family_members',
        'view_booking_history'
      ])
    })

    it('should validate family role correctly', () => {
      expect(hasRole(mockSession, 'family')).toBe(true)
      expect(hasRole(mockSession, 'director')).toBe(false)
      expect(hasRole(mockSession, 'venue')).toBe(false)
      expect(hasRole(mockSession, 'admin')).toBe(false)
    })

    it('should validate family permissions correctly', () => {
      expect(hasPermission(mockSession, 'view_services')).toBe(true)
      expect(hasPermission(mockSession, 'create_booking')).toBe(true)
      expect(hasPermission(mockSession, 'manage_profile')).toBe(true)
      expect(hasPermission(mockSession, 'view_memorials')).toBe(true)
      expect(hasPermission(mockSession, 'manage_family_members')).toBe(true)
      expect(hasPermission(mockSession, 'view_booking_history')).toBe(true)
      
      // Should not have director permissions
      expect(hasPermission(mockSession, 'manage_services')).toBe(false)
      expect(hasPermission(mockSession, 'view_clients')).toBe(false)
      expect(hasPermission(mockSession, 'manage_staff')).toBe(false)
    })

    it('should validate family resource access correctly', () => {
      expect(canAccessResource(mockSession, 'profile_management')).toBe(true)
      expect(canAccessResource(mockSession, 'memorial_access')).toBe(true)
      expect(canAccessResource(mockSession, 'service_booking')).toBe(true)
      expect(canAccessResource(mockSession, 'dashboard')).toBe(true)
      expect(canAccessResource(mockSession, 'notifications')).toBe(true)
      
      // Should not access admin/director resources
      expect(canAccessResource(mockSession, 'admin_panel')).toBe(false)
      expect(canAccessResource(mockSession, 'services_management')).toBe(false)
      expect(canAccessResource(mockSession, 'venue_management')).toBe(false)
    })

    it('should have correct route access for family', () => {
      const routeAccess = getRouteAccess('family')
      expect(routeAccess.allowedRoutes).toEqual(['/family', '/dashboard'])
      expect(routeAccess.defaultRoute).toBe('/family')
    })
  })

  describe('Venue User Role Tests', () => {
    beforeEach(() => {
      mockSession = createMockSession('venue')
    })

    it('should have correct venue permissions', () => {
      expect(ROLE_PERMISSIONS.venue).toEqual([
        'manage_venue',
        'view_bookings',
        'manage_availability',
        'view_analytics',
        'manage_venue_staff',
        'view_venue_reports'
      ])
    })

    it('should validate venue role correctly', () => {
      expect(hasRole(mockSession, 'venue')).toBe(true)
      expect(hasRole(mockSession, 'family')).toBe(false)
      expect(hasRole(mockSession, 'director')).toBe(false)
      expect(hasRole(mockSession, 'admin')).toBe(false)
    })

    it('should validate venue permissions correctly', () => {
      expect(hasPermission(mockSession, 'manage_venue')).toBe(true)
      expect(hasPermission(mockSession, 'view_bookings')).toBe(true)
      expect(hasPermission(mockSession, 'manage_availability')).toBe(true)
      expect(hasPermission(mockSession, 'view_analytics')).toBe(true)
      expect(hasPermission(mockSession, 'manage_venue_staff')).toBe(true)
      expect(hasPermission(mockSession, 'view_venue_reports')).toBe(true)
      
      // Should not have director-specific permissions
      expect(hasPermission(mockSession, 'manage_services')).toBe(false)
      expect(hasPermission(mockSession, 'view_clients')).toBe(false)
      expect(hasPermission(mockSession, 'manage_staff')).toBe(false)
    })

    it('should validate venue resource access correctly', () => {
      expect(canAccessResource(mockSession, 'venue_management')).toBe(true)
      expect(canAccessResource(mockSession, 'availability_management')).toBe(true)
      expect(canAccessResource(mockSession, 'venue_bookings')).toBe(true)
      expect(canAccessResource(mockSession, 'venue_staff')).toBe(true)
      expect(canAccessResource(mockSession, 'venue_analytics')).toBe(true)
      expect(canAccessResource(mockSession, 'dashboard')).toBe(true)
      
      // Should not access admin/director-only resources
      expect(canAccessResource(mockSession, 'admin_panel')).toBe(false)
      expect(canAccessResource(mockSession, 'services_management')).toBe(false)
      expect(canAccessResource(mockSession, 'client_management')).toBe(false)
    })

    it('should have correct route access for venue', () => {
      const routeAccess = getRouteAccess('venue')
      expect(routeAccess.allowedRoutes).toEqual(['/venue', '/dashboard'])
      expect(routeAccess.defaultRoute).toBe('/venue')
    })
  })

  describe('Director User Role Tests', () => {
    beforeEach(() => {
      mockSession = createMockSession('director')
    })

    it('should have correct director permissions', () => {
      expect(ROLE_PERMISSIONS.director).toEqual([
        'manage_services',
        'view_clients',
        'manage_bookings',
        'view_analytics',
        'manage_staff',
        'view_reports',
        'manage_inventory'
      ])
    })

    it('should validate director role correctly', () => {
      expect(hasRole(mockSession, 'director')).toBe(true)
      expect(hasRole(mockSession, 'family')).toBe(false)
      expect(hasRole(mockSession, 'venue')).toBe(false)
      expect(hasRole(mockSession, 'admin')).toBe(false)
    })

    it('should validate director permissions correctly', () => {
      expect(hasPermission(mockSession, 'manage_services')).toBe(true)
      expect(hasPermission(mockSession, 'view_clients')).toBe(true)
      expect(hasPermission(mockSession, 'manage_bookings')).toBe(true)
      expect(hasPermission(mockSession, 'view_analytics')).toBe(true)
      expect(hasPermission(mockSession, 'manage_staff')).toBe(true)
      expect(hasPermission(mockSession, 'view_reports')).toBe(true)
      expect(hasPermission(mockSession, 'manage_inventory')).toBe(true)
      
      // Should not have admin wildcard permission
      expect(hasPermission(mockSession, '*')).toBe(false)
    })

    it('should validate director resource access correctly', () => {
      expect(canAccessResource(mockSession, 'services_management')).toBe(true)
      expect(canAccessResource(mockSession, 'client_management')).toBe(true)
      expect(canAccessResource(mockSession, 'booking_management')).toBe(true)
      expect(canAccessResource(mockSession, 'staff_management')).toBe(true)
      expect(canAccessResource(mockSession, 'financial_reports')).toBe(true)
      expect(canAccessResource(mockSession, 'venue_analytics')).toBe(true)
      expect(canAccessResource(mockSession, 'dashboard')).toBe(true)
      
      // Should not access admin-only resources
      expect(canAccessResource(mockSession, 'admin_panel')).toBe(false)
      expect(canAccessResource(mockSession, 'user_management')).toBe(false)
      expect(canAccessResource(mockSession, 'system_settings')).toBe(false)
    })

    it('should have correct route access for director', () => {
      const routeAccess = getRouteAccess('director')
      expect(routeAccess.allowedRoutes).toEqual(['/director', '/dashboard'])
      expect(routeAccess.defaultRoute).toBe('/director')
    })
  })

  describe('Admin User Role Tests', () => {
    beforeEach(() => {
      mockSession = createMockSession('admin')
    })

    it('should have correct admin permissions', () => {
      expect(ROLE_PERMISSIONS.admin).toEqual(['*'])
    })

    it('should validate admin role correctly', () => {
      expect(hasRole(mockSession, 'admin')).toBe(true)
      expect(hasRole(mockSession, 'director')).toBe(false)
      expect(hasRole(mockSession, 'venue')).toBe(false)
      expect(hasRole(mockSession, 'family')).toBe(false)
    })

    it('should validate admin permissions correctly', () => {
      // Admin has wildcard permission, should pass all checks
      expect(hasPermission(mockSession, '*')).toBe(true)
      expect(hasPermission(mockSession, 'manage_services')).toBe(true)
      expect(hasPermission(mockSession, 'view_clients')).toBe(true)
      expect(hasPermission(mockSession, 'manage_venue')).toBe(true)
      expect(hasPermission(mockSession, 'view_services')).toBe(true)
      expect(hasPermission(mockSession, 'any_permission')).toBe(true)
    })

    it('should validate admin resource access correctly', () => {
      // Admin should have access to all resources
      expect(canAccessResource(mockSession, 'admin_panel')).toBe(true)
      expect(canAccessResource(mockSession, 'user_management')).toBe(true)
      expect(canAccessResource(mockSession, 'system_settings')).toBe(true)
      expect(canAccessResource(mockSession, 'services_management')).toBe(true)
      expect(canAccessResource(mockSession, 'venue_management')).toBe(true)
      expect(canAccessResource(mockSession, 'dashboard')).toBe(true)
    })

    it('should have correct route access for admin', () => {
      const routeAccess = getRouteAccess('admin')
      expect(routeAccess.allowedRoutes).toEqual(['/admin', '/director', '/venue', '/family', '/dashboard'])
      expect(routeAccess.defaultRoute).toBe('/admin')
    })
  })

  describe('Multi-Role Access Tests', () => {
    it('should validate multiple roles correctly', () => {
      const familySession = createMockSession('family')
      const directorSession = createMockSession('director')
      
      expect(hasRole(familySession, ['family', 'director'])).toBe(true)
      expect(hasRole(directorSession, ['family', 'director'])).toBe(true)
      expect(hasRole(familySession, ['venue', 'admin'])).toBe(false)
    })

    it('should validate shared resource access', () => {
      const familySession = createMockSession('family')
      const venueSession = createMockSession('venue')
      const directorSession = createMockSession('director')
      
      // All roles should access common resources
      expect(canAccessResource(familySession, 'dashboard')).toBe(true)
      expect(canAccessResource(venueSession, 'dashboard')).toBe(true)
      expect(canAccessResource(directorSession, 'dashboard')).toBe(true)
      
      expect(canAccessResource(familySession, 'notifications')).toBe(true)
      expect(canAccessResource(venueSession, 'notifications')).toBe(true)
      expect(canAccessResource(directorSession, 'notifications')).toBe(true)
    })
  })

  describe('User Management Permissions', () => {
    it('should validate admin can manage all users', () => {
      expect(canManageUser('admin', 'family')).toBe(true)
      expect(canManageUser('admin', 'venue')).toBe(true)
      expect(canManageUser('admin', 'director')).toBe(true)
      expect(canManageUser('admin', 'admin')).toBe(true)
    })

    it('should validate director can manage venue and family users', () => {
      expect(canManageUser('director', 'family')).toBe(true)
      expect(canManageUser('director', 'venue')).toBe(true)
      expect(canManageUser('director', 'director')).toBe(false)
      expect(canManageUser('director', 'admin')).toBe(false)
    })

    it('should validate venue can manage family users', () => {
      expect(canManageUser('venue', 'family')).toBe(true)
      expect(canManageUser('venue', 'venue')).toBe(false)
      expect(canManageUser('venue', 'director')).toBe(false)
      expect(canManageUser('venue', 'admin')).toBe(false)
    })

    it('should validate family cannot manage other users', () => {
      expect(canManageUser('family', 'family')).toBe(false)
      expect(canManageUser('family', 'venue')).toBe(false)
      expect(canManageUser('family', 'director')).toBe(false)
      expect(canManageUser('family', 'admin')).toBe(false)
    })
  })

  describe('Role Assignment Permissions', () => {
    it('should validate admin can assign all roles', () => {
      expect(canAssignRole('admin', 'family')).toBe(true)
      expect(canAssignRole('admin', 'venue')).toBe(true)
      expect(canAssignRole('admin', 'director')).toBe(true)
      expect(canAssignRole('admin', 'admin')).toBe(true)
    })

    it('should validate director can assign venue and family roles', () => {
      expect(canAssignRole('director', 'family')).toBe(true)
      expect(canAssignRole('director', 'venue')).toBe(true)
      expect(canAssignRole('director', 'director')).toBe(false)
      expect(canAssignRole('director', 'admin')).toBe(false)
    })

    it('should validate venue can assign family role only', () => {
      expect(canAssignRole('venue', 'family')).toBe(true)
      expect(canAssignRole('venue', 'venue')).toBe(false)
      expect(canAssignRole('venue', 'director')).toBe(false)
      expect(canAssignRole('venue', 'admin')).toBe(false)
    })

    it('should validate family cannot assign any roles', () => {
      expect(canAssignRole('family', 'family')).toBe(false)
      expect(canAssignRole('family', 'venue')).toBe(false)
      expect(canAssignRole('family', 'director')).toBe(false)
      expect(canAssignRole('family', 'admin')).toBe(false)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle null session gracefully', () => {
      expect(hasRole(null, 'family')).toBe(false)
      expect(hasPermission(null, 'view_services')).toBe(false)
      expect(canAccessResource(null, 'dashboard')).toBe(false)
    })

    it('should handle invalid role gracefully', () => {
      const invalidSession = {
        user: { id: '1', email: 'test@example.com', role: 'invalid' as UserRole },
        expires: '2024-12-31'
      } as Session
      
      expect(hasRole(invalidSession, 'family')).toBe(false)
      expect(canAccessResource(invalidSession, 'dashboard')).toBe(false)
    })

    it('should handle missing permissions gracefully', () => {
      const sessionWithoutPermissions = {
        user: { id: '1', email: 'test@example.com', role: 'family' as UserRole },
        expires: '2024-12-31'
      } as Session
      
      expect(hasPermission(sessionWithoutPermissions, 'view_services')).toBe(false)
    })

    it('should handle unknown resources gracefully', () => {
      const familySession = createMockSession('family')
      expect(canAccessResource(familySession, 'unknown_resource' as any)).toBe(false)
    })
  })

  describe('Permission Matrix Validation', () => {
    const testCases = [
      { role: 'family', resource: 'profile_management', expected: true },
      { role: 'family', resource: 'admin_panel', expected: false },
      { role: 'venue', resource: 'venue_management', expected: true },
      { role: 'venue', resource: 'client_management', expected: false },
      { role: 'director', resource: 'services_management', expected: true },
      { role: 'director', resource: 'admin_panel', expected: false },
      { role: 'admin', resource: 'admin_panel', expected: true },
      { role: 'admin', resource: 'venue_management', expected: true }
    ]

    testCases.forEach(({ role, resource, expected }) => {
      it(`should validate ${role} access to ${resource} is ${expected}`, () => {
        const session = createMockSession(role as UserRole)
        expect(canAccessResource(session, resource as keyof typeof RESOURCE_ACCESS)).toBe(expected)
      })
    })
  })
})