"use client"

import { useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Flower2, Users, Building2, MapPin, Loader2 } from "lucide-react"

export function SignInForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const isGoogleConfigured = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const handleDemoLogin = async (userType: "family" | "provider" | "venue") => {
    setLoading(userType)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const demoUser = {
      id: `demo-${userType}-${Date.now()}`,
      name:
        userType === "family" ? "Demo Familie" : userType === "provider" ? "Demo Uitvaartondernemer" : "Demo Locatie",
      email: `demo-${userType}@farewelly.nl`,
      userType,
      onboardingComplete: false,
    }

    localStorage.setItem("demoUser", JSON.stringify(demoUser))
    router.push(`/(${userType})/onboarding`)
    setLoading(null)
  }

  const handleGoogleSignIn = async () => {
    setLoading("google")
    await signIn("google", { callbackUrl: "/(auth)/onboarding" })
  }

  if (session) {
    router.push("/(auth)/onboarding")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Flower2 className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Welkom bij Farewelly</CardTitle>
          <p className="text-slate-600">Digitale hulp bij uitvaarten</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isGoogleConfigured && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <p className="text-amber-800 text-sm font-medium">Demo Mode</p>
              <p className="text-amber-700 text-xs">Google OAuth niet geconfigureerd</p>
            </div>
          )}

          {isGoogleConfigured ? (
            <Button onClick={handleGoogleSignIn} disabled={loading === "google"} className="w-full" size="lg">
              {loading === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Inloggen met Google
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-sm text-slate-600 font-medium">Kies uw gebruikerstype:</p>

              <Button
                onClick={() => handleDemoLogin("family")}
                disabled={loading !== null}
                variant="outline"
                className="w-full justify-start"
                size="lg"
              >
                {loading === "family" ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-3" />
                ) : (
                  <Users className="h-5 w-5 mr-3" />
                )}
                Familie - Demo Starten
              </Button>

              <Button
                onClick={() => handleDemoLogin("provider")}
                disabled={loading !== null}
                variant="outline"
                className="w-full justify-start"
                size="lg"
              >
                {loading === "provider" ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-3" />
                ) : (
                  <Building2 className="h-5 w-5 mr-3" />
                )}
                Uitvaartondernemer - Demo Starten
              </Button>

              <Button
                onClick={() => handleDemoLogin("venue")}
                disabled={loading !== null}
                variant="outline"
                className="w-full justify-start"
                size="lg"
              >
                {loading === "venue" ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-3" />
                ) : (
                  <MapPin className="h-5 w-5 mr-3" />
                )}
                Locatie Eigenaar - Demo Starten
              </Button>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-slate-500">Door in te loggen gaat u akkoord met onze voorwaarden</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
