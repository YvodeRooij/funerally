"use client"

import React from "react"
import { useAuth, useRoleAccess, usePermissionAccess, useResourceAccess } from "@/lib/auth-context"
import type { UserRole } from "@/types/next-auth"

interface RoleGuardProps {
  allowedRoles: UserRole | UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
  showLoading?: boolean
}

/**
 * Component that renders children only if user has required role
 */
export function RoleGuard({ 
  allowedRoles, 
  children, 
  fallback = null, 
  showLoading = false 
}: RoleGuardProps) {
  const { canAccess, isLoading } = useRoleAccess(allowedRoles)
  
  if (isLoading && showLoading) {
    return <div className="animate-pulse">Loading...</div>
  }
  
  if (!canAccess) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

interface PermissionGuardProps {
  requiredPermission: string
  children: React.ReactNode
  fallback?: React.ReactNode
  showLoading?: boolean
}

/**
 * Component that renders children only if user has required permission
 */
export function PermissionGuard({ 
  requiredPermission, 
  children, 
  fallback = null, 
  showLoading = false 
}: PermissionGuardProps) {
  const { canAccess, isLoading } = usePermissionAccess(requiredPermission)
  
  if (isLoading && showLoading) {
    return <div className="animate-pulse">Loading...</div>
  }
  
  if (!canAccess) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

interface ResourceGuardProps {
  resource: string
  children: React.ReactNode
  fallback?: React.ReactNode
  showLoading?: boolean
}

/**
 * Component that renders children only if user can access resource
 */
export function ResourceGuard({ 
  resource, 
  children, 
  fallback = null, 
  showLoading = false 
}: ResourceGuardProps) {
  const { canAccess, isLoading } = useResourceAccess(resource)
  
  if (isLoading && showLoading) {
    return <div className="animate-pulse">Loading...</div>
  }
  
  if (!canAccess) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
  showLoading?: boolean
}

/**
 * Component that renders children only if user is authenticated
 */
export function AuthGuard({ 
  children, 
  fallback = null, 
  requireAuth = true, 
  showLoading = false 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading && showLoading) {
    return <div className="animate-pulse">Loading...</div>
  }
  
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>
  }
  
  if (!requireAuth && isAuthenticated) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

interface ConditionalRenderProps {
  condition: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Simple conditional render component
 */
export function ConditionalRender({ 
  condition, 
  children, 
  fallback = null 
}: ConditionalRenderProps) {
  return condition ? <>{children}</> : <>{fallback}</>
}

// Combined guard for complex access control
interface CombinedGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  showLoading?: boolean
  requireAuth?: boolean
  allowedRoles?: UserRole | UserRole[]
  requiredPermissions?: string | string[]
  requiredResources?: string | string[]
  operator?: "AND" | "OR" // How to combine multiple conditions
}

/**
 * Advanced component that combines multiple access control checks
 */
export function CombinedGuard({
  children,
  fallback = null,
  showLoading = false,
  requireAuth = true,
  allowedRoles,
  requiredPermissions,
  requiredResources,
  operator = "AND"
}: CombinedGuardProps) {
  const { isAuthenticated, isLoading, hasRole, hasPermission, canAccess } = useAuth()
  
  if (isLoading && showLoading) {
    return <div className="animate-pulse">Loading...</div>
  }
  
  // Check authentication first
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>
  }
  
  const conditions: boolean[] = []
  
  // Check roles
  if (allowedRoles) {
    conditions.push(hasRole(allowedRoles))
  }
  
  // Check permissions
  if (requiredPermissions) {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
    if (operator === "AND") {
      conditions.push(permissions.every(permission => hasPermission(permission)))
    } else {
      conditions.push(permissions.some(permission => hasPermission(permission)))
    }
  }
  
  // Check resources
  if (requiredResources) {
    const resources = Array.isArray(requiredResources) ? requiredResources : [requiredResources]
    if (operator === "AND") {
      conditions.push(resources.every(resource => canAccess(resource)))
    } else {
      conditions.push(resources.some(resource => canAccess(resource)))
    }
  }
  
  // Evaluate conditions based on operator
  const hasAccess = operator === "AND" 
    ? conditions.every(condition => condition)
    : conditions.some(condition => condition)
  
  if (!hasAccess) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}