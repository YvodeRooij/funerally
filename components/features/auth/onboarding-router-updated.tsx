"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"

const OnboardingRouter = () => {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session?.user) {
      router.push("/auth")
      return
    }

    const checkOnboardingStatus = async () => {
      try {
        // Get user type from session
        const userType = (session.user as any).userType
        const onboardingComplete = (session.user as any).onboardingComplete

        if (!userType) {
          // No user type set, should not happen with new flow
          router.push("/auth")
          return
        }

        if (!onboardingComplete) {
          // Route to appropriate onboarding based on user type
          switch (userType) {
            case "family":
              router.push("/onboarding/family")
              break
            case "director":
              router.push("/onboarding/director")
              break
            case "venue":
              router.push("/onboarding/venue")
              break
            default:
              router.push("/auth")
          }
        } else {
          // Onboarding complete, route to appropriate dashboard
          switch (userType) {
            case "family":
              // Check if they have an incomplete intake
              const intakeResponse = await fetch('/api/family/check-intake')
              const intakeData = await intakeResponse.json()
              
              if (intakeData.hasIncompleteIntake) {
                router.push("/start")
              } else {
                router.push("/family/dashboard")
              }
              break
            case "director":
              router.push("/director/dashboard")
              break
            case "venue":
              router.push("/venue/dashboard")
              break
            default:
              router.push("/dashboard")
          }
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error)
        router.push("/")
      }
    }

    checkOnboardingStatus()
  }, [status, session, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-slate-600">Even geduld...</p>
      </div>
    </div>
  )
}

export default OnboardingRouter