"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Flower2, Users, Building2, MapPin, Loader2, ArrowLeft, ChevronRight } from "lucide-react"

type UserType = "family" | "director" | "venue"
type AuthStep = "returning" | "usertype" | "authmethod" | "loading"

interface ReturningUser {
  name: string
  userType: UserType
  lastSeen: number
  authProvider?: string
}

export default function UnifiedAuthPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State management
  const [currentStep, setCurrentStep] = useState<AuthStep>("returning")
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null)
  const [returningUser, setReturningUser] = useState<ReturningUser | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  // Check if OAuth providers are configured
  const isGoogleConfigured = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && 
    !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.includes('your-google')
  const isLinkedInConfigured = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID && 
    !process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID.includes('your-linkedin')

  // Detect returning user on mount
  useEffect(() => {
    const detectReturningUser = () => {
      try {
        const stored = localStorage.getItem('farewelly_user_preference')
        if (stored) {
          const userData: ReturningUser = JSON.parse(stored)
          // Check if data is less than 30 days old
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
          if (userData.lastSeen > thirtyDaysAgo) {
            setReturningUser(userData)
            setCurrentStep("returning")
            return
          }
        }
      } catch (error) {
        console.log("No returning user data found")
      }
      
      // No returning user, start with user type selection
      setCurrentStep("usertype")
    }

    detectReturningUser()
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const userType = (session.user as any).userType
      if (userType) {
        router.push(`/dashboard?type=${userType}`)
      } else {
        router.push("/onboarding")
      }
    }
  }, [status, session, router])

  const getUserTypeInfo = (type: UserType) => {
    switch (type) {
      case "family":
        return {
          label: "Familie",
          description: "Ik moet een uitvaart regelen voor een dierbare",
          icon: Users,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          emoji: "👨‍👩‍👧‍👦"
        }
      case "director":
        return {
          label: "Uitvaartondernemer", 
          description: "Ik ben een uitvaartondernemer en help families",
          icon: Building2,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200", 
          emoji: "⚱️"
        }
      case "venue":
        return {
          label: "Locatie-eigenaar",
          description: "Ik verhuur locaties voor uitvaarten",
          icon: MapPin,
          color: "text-green-600",
          bgColor: "bg-green-50", 
          borderColor: "border-green-200",
          emoji: "🏛️"
        }
    }
  }

  const handleReturningUserAuth = async () => {
    if (!returningUser) return
    
    setLoading("returning")
    
    // If they have a preferred auth provider, use it
    if (returningUser.authProvider && (isGoogleConfigured || isLinkedInConfigured)) {
      await handleOAuthSignIn(returningUser.authProvider as "google" | "linkedin")
    } else {
      // Otherwise, show auth methods for their user type
      setSelectedUserType(returningUser.userType)
      setCurrentStep("authmethod")
      setLoading(null)
    }
  }

  const handleUserTypeSelect = (userType: UserType) => {
    setSelectedUserType(userType)
    setCurrentStep("authmethod")
    
    // Store preference for next time (without personal info)
    const preference = {
      userType,
      lastSeen: Date.now()
    }
    localStorage.setItem('farewelly_user_preference_type', JSON.stringify(preference))
  }

  const handleOAuthSignIn = async (provider: "google" | "linkedin") => {
    try {
      setLoading(provider)
      
      // Store user type for after OAuth
      if (selectedUserType) {
        sessionStorage.setItem("pendingUserType", selectedUserType)
      }
      
      await signIn(provider, {
        callbackUrl: "/auth/callback",
        redirect: true,
      })
    } catch (err: any) {
      console.error(`${provider} OAuth error:`, err)
      setLoading(null)
    }
  }

  const handleDemoLogin = async () => {
    if (!selectedUserType) return
    
    setLoading("demo")
    
    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    // Create demo user
    const demoUser = {
      id: `demo-${selectedUserType}-${Date.now()}`,
      name: `Demo ${getUserTypeInfo(selectedUserType).label}`,
      email: `demo-${selectedUserType}@farewelly.nl`,
      userType: selectedUserType,
      onboardingComplete: true,
      image: `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUserType}`,
    }

    localStorage.setItem("demoUser", JSON.stringify(demoUser))
    
    // Store as returning user for next time
    const returningUserData: ReturningUser = {
      name: demoUser.name,
      userType: selectedUserType,
      lastSeen: Date.now()
    }
    localStorage.setItem('farewelly_user_preference', JSON.stringify(returningUserData))
    
    router.push(`/dashboard?type=${selectedUserType}`)
  }

  const handleNewAccount = () => {
    localStorage.removeItem('farewelly_user_preference')
    setReturningUser(null)
    setCurrentStep("usertype")
  }

  // Loading state
  if (status === "loading" || currentStep === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <h2 className="text-lg font-medium text-slate-900">Laden...</h2>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center pt-8 pb-6">
          <div className="flex items-center justify-center mb-4">
            <Flower2 className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-serif text-slate-900 mb-2">
            {currentStep === "returning" ? "Welkom terug" : 
             currentStep === "usertype" ? "Welkom bij Farewelly" :
             "Hoe wilt u doorgaan?"}
          </h1>
          <p className="text-slate-600">
            {currentStep === "returning" ? "Ga verder waar u was gebleven" :
             currentStep === "usertype" ? "Digitale ondersteuning bij uitvaarten" :
             `Doorgaan als ${getUserTypeInfo(selectedUserType!).label.toLowerCase()}`}
          </p>
        </div>

        <CardContent className="space-y-6">
          {/* Step 1: Returning User */}
          {currentStep === "returning" && returningUser && (
            <div className="space-y-4">
              <Button
                onClick={handleReturningUserAuth}
                disabled={loading === "returning"}
                className="w-full h-auto p-6 text-left bg-blue-50 hover:bg-blue-100 border border-blue-200 text-slate-900"
                variant="outline"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl">
                      {getUserTypeInfo(returningUser.userType).emoji}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{returningUser.name}</div>
                      <div className="text-sm text-slate-600">{getUserTypeInfo(returningUser.userType).label}</div>
                    </div>
                  </div>
                  {loading === "returning" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </div>
              </Button>
              
              <Button
                onClick={handleNewAccount}
                variant="ghost"
                className="w-full"
                disabled={loading === "returning"}
              >
                Ander account gebruiken
              </Button>
            </div>
          )}

          {/* Step 2: User Type Selection */}
          {currentStep === "usertype" && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Ik ben een...</h3>
                <p className="text-sm text-slate-600">Selecteer uw situatie om door te gaan</p>
              </div>

              {(["family", "director", "venue"] as UserType[]).map((type) => {
                const info = getUserTypeInfo(type)
                const Icon = info.icon
                return (
                  <Button
                    key={type}
                    onClick={() => handleUserTypeSelect(type)}
                    variant="outline"
                    className={`w-full justify-start h-auto p-4 text-left hover:${info.bgColor} ${info.borderColor}`}
                  >
                    <div className="flex items-start space-x-3 w-full">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{info.emoji}</span>
                        <Icon className={`h-6 w-6 ${info.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{info.label}</div>
                        <div className="text-sm text-slate-600 mt-1">{info.description}</div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400 mt-1" />
                    </div>
                  </Button>
                )
              })}
            </div>
          )}

          {/* Step 3: Auth Method Selection */}
          {currentStep === "authmethod" && selectedUserType && (
            <div className="space-y-4">
              {/* Back button */}
              <Button
                onClick={() => setCurrentStep("usertype")}
                variant="ghost"
                size="sm"
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug
              </Button>

              {/* Current selection indicator */}
              <div className={`p-3 rounded-lg ${getUserTypeInfo(selectedUserType).bgColor} ${getUserTypeInfo(selectedUserType).borderColor} border`}>
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getUserTypeInfo(selectedUserType).emoji}</span>
                  <div>
                    <div className="font-medium text-slate-900">{getUserTypeInfo(selectedUserType).label}</div>
                    <div className="text-xs text-slate-600">{getUserTypeInfo(selectedUserType).description}</div>
                  </div>
                </div>
              </div>

              {/* OAuth Options */}
              {(isGoogleConfigured || isLinkedInConfigured) && (
                <div className="space-y-3">
                  {isGoogleConfigured && (
                    <Button
                      onClick={() => handleOAuthSignIn("google")}
                      disabled={loading !== null}
                      className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
                      size="lg"
                    >
                      {loading === "google" ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      Doorgaan met Google
                    </Button>
                  )}

                  {isLinkedInConfigured && (
                    <Button
                      onClick={() => handleOAuthSignIn("linkedin")}
                      disabled={loading !== null}
                      className="w-full bg-[#0077B5] hover:bg-[#0066A0] text-white"
                      size="lg"
                    >
                      {loading === "linkedin" ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      )}
                      Doorgaan met LinkedIn
                    </Button>
                  )}

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

              {/* Demo Option */}
              <Button
                onClick={handleDemoLogin}
                disabled={loading !== null}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {loading === "demo" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Demo laden...
                  </>
                ) : (
                  <>
                    🚀 Demo proberen
                  </>
                )}
              </Button>

              {!isGoogleConfigured && !isLinkedInConfigured && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center mt-4">
                  <p className="text-amber-800 text-sm font-medium">🚀 Demo Mode</p>
                  <p className="text-amber-700 text-xs">OAuth providers nog niet geconfigureerd</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Door verder te gaan accepteert u onze{" "}
              <button className="text-blue-600 hover:underline">
                privacyvoorwaarden
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}