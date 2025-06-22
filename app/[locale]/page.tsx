"use client"

/**
 * LANDING PAGE - THREE USER PATHS
 *
 * Purpose: Clear entry point for families, directors, and venue owners
 * Features: Smart routing based on user intent
 * UX: Immediate clarity, no confusion about user type
 */
import { useState, useEffect } from "react"
import { Hero } from "@/components/sections/hero"
import { Features } from "@/components/sections/features"
import { HowItWorks } from "@/components/sections/how-it-works"
import { Testimonials } from "@/components/sections/testimonials"
import { CTA } from "@/components/sections/cta"
import { UserTypeSelection } from "@/components/layout/user-type-selection"
import { UserTypeSwitcher } from "@/components/layout/user-type-switcher"
import { cn } from "@/lib/utils"

export type UserType = "family" | "director" | "venue"

export default function HomePage() {
  const [userType, setUserType] = useState<UserType | null>(null)
  const [isSelectionDone, setIsSelectionDone] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    // Check for stored user type preference
    const storedUserType = localStorage.getItem("userType") as UserType | null
    if (storedUserType) {
      setUserType(storedUserType)
      setIsSelectionDone(true)
    }
  }, [])

  const handleUserTypeSelect = (type: UserType) => {
    setIsTransitioning(true)

    setTimeout(() => {
      setUserType(type)
      localStorage.setItem("userType", type)
      setIsSelectionDone(true)
      setIsTransitioning(false)
    }, 300)
  }

  const handleSwitchUserType = (type: UserType) => {
    if (type === userType) return

    setIsTransitioning(true)

    setTimeout(() => {
      setUserType(type)
      localStorage.setItem("userType", type)
      setIsTransitioning(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 200)
  }

  // Show selection screen if no user type is chosen
  if (!isSelectionDone) {
    return <UserTypeSelection onSelect={handleUserTypeSelect} />
  }

  if (!userType) {
    return <UserTypeSelection onSelect={handleUserTypeSelect} />
  }

  return (
    <>
      <UserTypeSwitcher currentUserType={userType} onSwitch={handleSwitchUserType} />

      <main
        className={cn(
          "transition-all duration-500 ease-out",
          isTransitioning ? "opacity-50 scale-95" : "opacity-100 scale-100",
        )}
      >
        <Hero userType={userType} />
        <Features userType={userType} />
        <HowItWorks userType={userType} />
        <Testimonials userType={userType} />
        <CTA userType={userType} />
      </main>
    </>
  )
}
