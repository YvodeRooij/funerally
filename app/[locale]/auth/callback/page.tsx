"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (status === "loading") return

      if (status === "authenticated" && session?.user) {
        // Check if user has a userType
        const userObj = session.user as any
        
        if (!userObj.userType || userObj.isNewUser) {
          // Get pending user type from sessionStorage
          const pendingUserType = sessionStorage.getItem("pendingUserType")
          
          if (pendingUserType) {
            try {
              // Update user type via API
              const response = await fetch("/api/auth/update-user-type", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userType: pendingUserType,
                  userId: userObj.userId,
                }),
              })

              if (response.ok) {
                // Update the session with new user type
                await update({
                  userType: pendingUserType,
                  role: pendingUserType,
                })
                
                // Clear pending user type
                sessionStorage.removeItem("pendingUserType")
                
                // Redirect to onboarding
                router.push("/onboarding")
              } else {
                // If update fails, still go to onboarding
                router.push("/onboarding")
              }
            } catch (error) {
              console.error("Error updating user type:", error)
              router.push("/onboarding")
            }
          } else {
            // No pending user type, go to onboarding
            router.push("/onboarding")
          }
        } else {
          // User already has a type, go to dashboard
          router.push(`/dashboard?type=${userObj.userType}`)
        }
      } else if (status === "unauthenticated") {
        // Authentication failed
        router.push("/signin?error=OAuthCallback")
      }
    }

    handleOAuthCallback()
  }, [status, session, router, update])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <h2 className="text-lg font-medium text-slate-900">Account aanmaken...</h2>
            <p className="text-sm text-slate-600 text-center">
              We zijn uw account aan het configureren. Een moment geduld alstublieft.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}