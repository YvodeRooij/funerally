/**
 * THEME TOGGLE - Simple dark/light mode switcher
 *
 * Purpose: Allows users to switch between light, dark, and system themes
 * Features: Icon-based toggle, system preference detection
 * UX: Reduces eye strain during emotional times
 */

"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "./theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />
      case "dark":
        return <Moon className="h-4 w-4" />
      case "system":
        return <Monitor className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      aria-label={`Current theme: ${theme}. Click to cycle themes.`}
    >
      {getIcon()}
    </Button>
  )
}
