import type { Session } from "next-auth"
import type { UserRole } from "@/types/next-auth"

// Role hierarchy - higher index = higher priority
export const ROLE_HIERARCHY: UserRole[] = ["family", "venue", "director", "admin"]

// Permission definitions for each role
export const ROLE_PERMISSIONS = {
  admin: ["*"], // Full access
  director: [
    "manage_services",
    "view_clients",
    "manage_bookings",
    "view_analytics",
    "manage_staff",
    "view_reports",
    "manage_inventory"
  ],
  venue: [
    "manage_venue",
    "view_bookings",
    "manage_availability",
    "view_analytics",
    "manage_venue_staff",
    "view_venue_reports"
  ],
  family: [
    "view_services",
    "create_booking",
    "manage_profile",
    "view_memorials",
    "manage_family_members",
    "view_booking_history"
  ]
} as const

// Resource access rules
export const RESOURCE_ACCESS = {
  // Admin only
  admin_panel: ["admin"],
  user_management: ["admin"],
  system_settings: ["admin"],
  global_analytics: ["admin"],
  
  // Director access
  services_management: ["admin", "director"],
  client_management: ["admin", "director"],
  booking_management: ["admin", "director"],
  staff_management: ["admin", "director"],
  financial_reports: ["admin", "director"],
  
  // Venue access
  venue_management: ["admin", "venue"],
  availability_management: ["admin", "venue"],
  venue_bookings: ["admin", "venue"],
  venue_staff: ["admin", "venue"],
  venue_analytics: ["admin", "venue", "director"],
  
  // Family access
  profile_management: ["admin", "director", "venue", "family"],
  memorial_access: ["admin", "director", "venue", "family"],
  service_booking: ["admin", "director", "venue", "family"],
  family_dashboard: ["admin", "director", "venue", "family"],
  
  // Common access
  dashboard: ["admin", "director", "venue", "family"],
  notifications: ["admin", "director", "venue", "family"],
  support: ["admin", "director", "venue", "family"],
} as const

/**
 * Check if a user has a specific role
 */
export function hasRole(session: Session | null, role: UserRole | UserRole[]): boolean {
  if (!session?.user?.role) return false
  
  const roles = Array.isArray(role) ? role : [role]
  return roles.includes(session.user.role)
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(session: Session | null, permission: string): boolean {
  if (!session?.user?.permissions) return false
  
  // Admin has all permissions
  if (session.user.permissions.includes("*")) return true
  
  return session.user.permissions.includes(permission)
}

/**
 * Check if a user can access a specific resource
 */
export function canAccessResource(session: Session | null, resource: keyof typeof RESOURCE_ACCESS): boolean {
  if (!session?.user?.role) return false
  
  const allowedRoles = RESOURCE_ACCESS[resource]
  if (!allowedRoles) return false
  
  return allowedRoles.includes(session.user.role)
}

/**
 * Get role hierarchy level (higher number = higher authority)
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role)
}

/**
 * Check if a role has higher or equal authority than another role
 */
export function hasRoleAuthority(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole)
}

/**
 * Check if user is authenticated and not a new user
 */
export function isAuthenticated(session: Session | null): boolean {
  return !!session && !!session.user && !session.user.isNewUser
}

/**
 * Check if user needs onboarding
 */
export function needsOnboarding(session: Session | null): boolean {
  return !!session && !!session.user && !!session.user.isNewUser
}

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Get dashboard URL based on user role
 */
export function getDashboardUrl(role: UserRole | null): string {
  switch (role) {
    case "admin":
      return "/admin"
    case "director":
      return "/director"
    case "venue":
      return "/venue"
    case "family":
      return "/family"
    default:
      return "/dashboard"
  }
}

/**
 * Get user display name with fallback
 */
export function getUserDisplayName(session: Session | null): string {
  if (!session?.user) return "Guest"
  
  return session.user.name || session.user.email || "User"
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(session: Session | null): string {
  if (!session?.user?.name) return "U"
  
  return session.user.name
    .split(" ")
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")
}

/**
 * Check if user can manage another user (based on role hierarchy)
 */
export function canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
  // Admin can manage everyone
  if (managerRole === "admin") return true
  
  // Directors can manage venue and family users
  if (managerRole === "director" && (targetRole === "venue" || targetRole === "family")) {
    return true
  }
  
  // Venue managers can manage family users in their venue
  if (managerRole === "venue" && targetRole === "family") {
    return true
  }
  
  return false
}

/**
 * Get allowed roles that a user can assign to others
 */
export function getAllowedRolesToAssign(userRole: UserRole): UserRole[] {
  switch (userRole) {
    case "admin":
      return ["admin", "director", "venue", "family"]
    case "director":
      return ["venue", "family"]
    case "venue":
      return ["family"]
    default:
      return []
  }
}

/**
 * Validate if a role assignment is allowed
 */
export function canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
  const allowedRoles = getAllowedRolesToAssign(assignerRole)
  return allowedRoles.includes(targetRole)
}

/**
 * Get route access based on user role
 */
export function getRouteAccess(role: UserRole | null): {
  allowedRoutes: string[]
  defaultRoute: string
} {
  switch (role) {
    case "admin":
      return {
        allowedRoutes: ["/admin", "/director", "/venue", "/family", "/dashboard"],
        defaultRoute: "/admin"
      }
    case "director":
      return {
        allowedRoutes: ["/director", "/dashboard"],
        defaultRoute: "/director"
      }
    case "venue":
      return {
        allowedRoutes: ["/venue", "/dashboard"],
        defaultRoute: "/venue"
      }
    case "family":
      return {
        allowedRoutes: ["/family", "/dashboard"],
        defaultRoute: "/family"
      }
    default:
      return {
        allowedRoutes: ["/"],
        defaultRoute: "/"
      }
  }
}