"use client"

import { useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Flower2, Users, Building2, MapPin, Loader2 } from "lucide-react"

export default function SignInPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  // Check if Google OAuth is configured
  const isGoogleConfigured = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const handleDemoLogin = async (userType: "family" | "director" | "venue") => {
    setLoading(userType)

    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Create demo user based on type
    const demoUser = {
      id: `demo-${userType}-${Date.now()}`,
      name: getUserTypeName(userType),
      email: `demo-${userType}@farewelly.nl`,
      userType,
      onboardingComplete: true, // Skip onboarding for demo
      image: `https://api.dicebear.com/7.x/initials/svg?seed=${userType}`,
    }

    localStorage.setItem("demoUser", JSON.stringify(demoUser))

    // Redirect directly to dashboard for demo
    router.push(`/dashboard?type=${userType}`)
    setLoading(null)
  }

  const getUserTypeName = (userType: string) => {
    switch (userType) {
      case "family":
        return "Demo Familie"
      case "director":
        return "Demo Uitvaartondernemer"
      case "venue":
        return "Demo Locatie-eigenaar"
      default:
        return "Demo Gebruiker"
    }
  }

  const getUserTypeDescription = (userType: string) => {
    switch (userType) {
      case "family":
        return "Ik moet een uitvaart regelen voor een dierbare"
      case "director":
        return "Ik ben een uitvaartondernemer en help families"
      case "venue":
        return "Ik verhuur locaties voor uitvaarten"
      default:
        return ""
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading("google")
    // In production, this will redirect to Google OAuth
    // After successful login, user will be redirected to their dashboard
    await signIn("google", {
      callbackUrl: "/onboarding", // This will handle user type selection if needed
    })
  }

  // If user is already logged in, redirect to their dashboard
  if (session?.user) {
    const userType = (session.user as any).userType
    if (userType) {
      router.push(`/dashboard?type=${userType}`)
    } else {
      router.push("/onboarding")
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Flower2 className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-serif">Welkom bij Farewelly</CardTitle>
          <p className="text-slate-600 text-lg">Digitale ondersteuning bij uitvaarten</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google OAuth Button - Always show if configured */}
          {isGoogleConfigured && (
            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading === "google"}
                className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
                size="lg"
              >
                {loading === "google" ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Inloggen met Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-50 px-2 text-slate-500">Of probeer demo</span>
                </div>
              </div>
            </div>
          )}

          {/* Demo Mode Notice */}
          {!isGoogleConfigured && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <p className="text-amber-800 text-sm font-medium">🚀 Demo Mode</p>
              <p className="text-amber-700 text-xs">Google OAuth niet geconfigureerd - kies demo optie</p>
            </div>
          )}

          {/* User Type Selection for Demo */}
          <div className="space-y-3">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {isGoogleConfigured ? "Demo proberen?" : "Kies uw gebruikerstype"}
              </h3>
              <p className="text-sm text-slate-600">
                {isGoogleConfigured
                  ? "Test de applicatie met een demo account"
                  : "Selecteer uw situatie om te beginnen"}
              </p>
            </div>

            {/* Family Option */}
            <Button
              onClick={() => handleDemoLogin("family")}
              disabled={loading !== null}
              variant="outline"
              className="w-full justify-start h-auto p-4 text-left hover:bg-blue-50 border-blue-200"
              size="lg"
            >
              <div className="flex items-start space-x-3 w-full">
                {loading === "family" ? (
                  <Loader2 className="h-6 w-6 animate-spin mt-1 text-blue-600" />
                ) : (
                  <Users className="h-6 w-6 mt-1 text-blue-600" />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">👨‍👩‍👧‍👦 Familie</div>
                  <div className="text-sm text-slate-600 mt-1">{getUserTypeDescription("family")}</div>
                </div>
              </div>
            </Button>

            {/* Director Option */}
            <Button
              onClick={() => handleDemoLogin("director")}
              disabled={loading !== null}
              variant="outline"
              className="w-full justify-start h-auto p-4 text-left hover:bg-purple-50 border-purple-200"
              size="lg"
            >
              <div className="flex items-start space-x-3 w-full">
                {loading === "director" ? (
                  <Loader2 className="h-6 w-6 animate-spin mt-1 text-purple-600" />
                ) : (
                  <Building2 className="h-6 w-6 mt-1 text-purple-600" />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">⚱️ Uitvaartondernemer</div>
                  <div className="text-sm text-slate-600 mt-1">{getUserTypeDescription("director")}</div>
                </div>
              </div>
            </Button>

            {/* Venue Option */}
            <Button
              onClick={() => handleDemoLogin("venue")}
              disabled={loading !== null}
              variant="outline"
              className="w-full justify-start h-auto p-4 text-left hover:bg-green-50 border-green-200"
              size="lg"
            >
              <div className="flex items-start space-x-3 w-full">
                {loading === "venue" ? (
                  <Loader2 className="h-6 w-6 animate-spin mt-1 text-green-600" />
                ) : (
                  <MapPin className="h-6 w-6 mt-1 text-green-600" />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">🏛️ Locatie-eigenaar</div>
                  <div className="text-sm text-slate-600 mt-1">{getUserTypeDescription("venue")}</div>
                </div>
              </div>
            </Button>
          </div>

          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Door verder te gaan accepteert u onze{" "}
              <a href="/privacy" className="text-blue-600 hover:underline">
                privacyvoorwaarden
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
