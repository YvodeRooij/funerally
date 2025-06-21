"use client"

import React from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserDisplayName, getUserInitials } from "@/lib/auth-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  ChevronDown 
} from "lucide-react"

interface UserProfileProps {
  variant?: "minimal" | "detailed" | "dropdown"
  showRole?: boolean
  showPermissions?: boolean
  className?: string
}

export function UserProfile({ 
  variant = "dropdown", 
  showRole = true, 
  showPermissions = false,
  className = ""
}: UserProfileProps) {
  const { user, userRole, userPermissions, signOut, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      </div>
    )
  }
  
  if (!user) {
    return null
  }
  
  const displayName = getUserDisplayName({ user } as any)
  const initials = getUserInitials({ user } as any)
  
  const handleSignOut = async () => {
    await signOut()
  }
  
  if (variant === "minimal") {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.image || ""} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium truncate">{displayName}</span>
        {showRole && userRole && (
          <Badge variant="secondary" className="text-xs">
            {userRole}
          </Badge>
        )}
      </div>
    )
  }
  
  if (variant === "detailed") {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image || ""} alt={displayName} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{displayName}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {showRole && userRole && (
              <Badge variant="outline" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
            )}
          </div>
        </div>
        
        {showPermissions && userPermissions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Permissions</h4>
            <div className="flex flex-wrap gap-1">
              {userPermissions.includes("*") ? (
                <Badge variant="destructive" className="text-xs">
                  Full Access
                </Badge>
              ) : (
                userPermissions.slice(0, 5).map((permission) => (
                  <Badge key={permission} variant="secondary" className="text-xs">
                    {permission.replace(/_/g, " ")}
                  </Badge>
                ))
              )}
              {userPermissions.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{userPermissions.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    )
  }
  
  // Default: dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`flex items-center space-x-2 ${className}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || ""} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium truncate max-w-32">
              {displayName}
            </span>
            {showRole && userRole && (
              <span className="text-xs text-muted-foreground">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            {showRole && userRole && (
              <Badge variant="outline" className="text-xs w-fit">
                <Shield className="w-3 h-3 mr-1" />
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Quick access component for user avatar only
export function UserAvatar({ 
  size = "default", 
  className = "" 
}: { 
  size?: "sm" | "default" | "lg"
  className?: string 
}) {
  const { user } = useAuth()
  
  if (!user) return null
  
  const displayName = getUserDisplayName({ user } as any)
  const initials = getUserInitials({ user } as any)
  
  const sizeClasses = {
    sm: "h-6 w-6",
    default: "h-8 w-8",
    lg: "h-12 w-12"
  }
  
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={user.image || ""} alt={displayName} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}