"use client"

import { useRouter } from "next/router"
import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"

const OnboardingRouter = () => {
  const { isLoaded, userId, sessionId, getToken } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    if (!userId) {
      router.push("/sign-in")
      return
    }

    const checkOnboardingStatus = async () => {
      try {
        const token = await getToken({ template: "supabase" })
        const response = await fetch("/api/onboarding", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          console.error("Failed to fetch onboarding status:", response.status)
          return
        }

        const data = await response.json()

        if (data.onboardingStatus === "not_started") {
          router.push("/onboarding/role-select")
        } else if (data.onboardingStatus === "director") {
          router.push("/onboarding/director")
        } else if (data.onboardingStatus === "family") {
          router.push("/onboarding/family")
        } else if (data.onboardingStatus === "venue") {
          router.push("/onboarding/venue")
        } else if (data.onboardingStatus === "complete") {
          router.push("/")
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error)
      }
    }

    checkOnboardingStatus()
  }, [isLoaded, userId, router, getToken])

  return null
}

export default OnboardingRouter
