"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useSession, signOut as nextAuthSignOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { Session } from "next-auth"
import type { UserRole } from "@/types/next-auth"

interface AuthContextType {
  // Session data
  session: Session | null
  user: Session["user"] | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // User properties
  userRole: UserRole | null
  userPermissions: string[]
  isNewUser: boolean
  
  // Auth actions
  signOut: () => Promise<void>
  updateSession: (data: Partial<Session>) => Promise<void>
  
  // Permission helpers
  hasPermission: (permission: string) => boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
  canAccess: (resource: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(status === "loading")
  }, [status])

  const signOut = async () => {
    try {
      await nextAuthSignOut({ 
        callbackUrl: "/",
        redirect: true 
      })
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const updateSession = async (data: Partial<Session>) => {
    try {
      await update(data)
    } catch (error) {
      console.error("Session update error:", error)
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!session?.user?.permissions) return false
    
    // Admin has all permissions
    if (session.user.permissions.includes("*")) return true
    
    return session.user.permissions.includes(permission)
  }

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!session?.user?.role) return false
    
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(session.user.role)
  }

  const canAccess = (resource: string): boolean => {
    if (!session?.user) return false
    
    // Admin can access everything
    if (session.user.role === "admin") return true
    
    // Define resource access rules
    const resourceAccess: Record<string, UserRole[]> = {
      // Admin only
      "admin_panel": ["admin"],
      "user_management": ["admin"],
      "system_settings": ["admin"],
      
      // Director access
      "services_management": ["admin", "director"],
      "client_management": ["admin", "director"],
      "booking_management": ["admin", "director"],
      "analytics": ["admin", "director", "venue"],
      
      // Venue access
      "venue_management": ["admin", "venue"],
      "availability_management": ["admin", "venue"],
      "venue_bookings": ["admin", "venue"],
      
      // Family access
      "profile_management": ["admin", "director", "venue", "family"],
      "memorial_access": ["admin", "director", "venue", "family"],
      "service_booking": ["admin", "director", "venue", "family"],
      
      // Common access
      "dashboard": ["admin", "director", "venue", "family"],
      "notifications": ["admin", "director", "venue", "family"],
    }
    
    const allowedRoles = resourceAccess[resource]
    if (!allowedRoles) return false
    
    return hasRole(allowedRoles)
  }

  const contextValue: AuthContextType = {
    // Session data
    session,
    user: session?.user || null,
    isLoading,
    isAuthenticated: !!session && !!session.user && !session.user.isNewUser,
    
    // User properties
    userRole: session?.user?.role || null,
    userPermissions: session?.user?.permissions || [],
    isNewUser: session?.user?.isNewUser || false,
    
    // Auth actions
    signOut,
    updateSession,
    
    // Permission helpers
    hasPermission,
    hasRole,
    canAccess,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Hook for role-based conditional rendering
export function useRoleAccess(allowedRoles: UserRole | UserRole[]) {
  const { hasRole, isAuthenticated, isLoading } = useAuth()
  
  return {
    canAccess: isAuthenticated && hasRole(allowedRoles),
    isLoading,
    isAuthenticated
  }
}

// Hook for permission-based conditional rendering
export function usePermissionAccess(requiredPermission: string) {
  const { hasPermission, isAuthenticated, isLoading } = useAuth()
  
  return {
    canAccess: isAuthenticated && hasPermission(requiredPermission),
    isLoading,
    isAuthenticated
  }
}

// Hook for resource access checking
export function useResourceAccess(resource: string) {
  const { canAccess, isAuthenticated, isLoading } = useAuth()
  
  return {
    canAccess: isAuthenticated && canAccess(resource),
    isLoading,
    isAuthenticated
  }
}