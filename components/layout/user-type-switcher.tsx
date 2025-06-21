"use client"

/**
 * SUBTLE USER TYPE SWITCHER COMPONENT
 *
 * Purpose: Discrete toggle between Family and Provider views
 * Features: Minimal design, integrated into navigation, subtle indicators
 */
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { UserType } from "@/app/page"
import { cn } from "@/lib/utils"
import { Users, Home, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface UserTypeSwitcherProps {
  currentUserType: UserType
  onSwitch: (userType: UserType) => void
}

export function UserTypeSwitcher({ currentUserType, onSwitch }: UserTypeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSwitch = (userType: UserType) => {
    if (userType === currentUserType) return
    onSwitch(userType)
    setIsOpen(false)
  }

  const currentLabel = currentUserType === "family" ? "Familie" : "Ondernemer"
  const currentIcon = currentUserType === "family" ? Home : Users

  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        
        <DropdownMenuContent align="end" className="w-48 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <DropdownMenuItem
            onClick={() => handleSwitch("family")}
            className={cn("cursor-pointer", currentUserType === "family" && "bg-slate-100 dark:bg-slate-700")}
          >
            <Home className="h-4 w-4 mr-2" />
            <span>Familie</span>
            {currentUserType === "family" && (
              <div className="ml-auto w-2 h-2 bg-slate-600 dark:bg-slate-400 rounded-full" />
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSwitch("provider")}
            className={cn("cursor-pointer", currentUserType === "provider" && "bg-slate-100 dark:bg-slate-700")}
          >
            <Users className="h-4 w-4 mr-2" />
            
            {currentUserType === "provider" && (
              <div className="ml-auto w-2 h-2 bg-slate-600 dark:bg-slate-400 rounded-full" />
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
