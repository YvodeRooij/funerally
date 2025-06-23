"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Flower2, Users, Building2, MapPin, Loader2, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SignUpFormData {
  email: string
  password: string
  confirmPassword: string
  name: string
  userType: "family" | "director" | "venue"
}

export function SignUpForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<SignUpFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    userType: "family"
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<"google" | "linkedin" | null>(null)

  // Check if OAuth providers are configured
  const isGoogleConfigured = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== "your-google-client-id"
  const isLinkedInConfigured = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID && process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID !== "your-linkedin-client-id"

  const handleInputChange = (field: keyof SignUpFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name) {
      setError("Alle velden zijn verplicht")
      return false
    }

    if (formData.password.length < 6) {
      setError("Wachtwoord moet minstens 6 karakters lang zijn")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Wachtwoorden komen niet overeen")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Voer een geldig e-mailadres in")
      return false
    }

    return true
  }

  const handleOAuthSignUp = async (provider: "google" | "linkedin") => {
    try {
      setOauthLoading(provider)
      setError(null)
      
      // Store user type preference for after OAuth
      sessionStorage.setItem("pendingUserType", formData.userType)
      
      await signIn(provider, {
        callbackUrl: "/auth/callback",
        redirect: true,
      })
    } catch (err: any) {
      console.error(`${provider} OAuth error:`, err)
      setError(`Er is een fout opgetreden bij het inloggen met ${provider}`)
      setOauthLoading(null)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          userType: formData.userType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Er is een fout opgetreden")
      }

      if (data.success) {
        // Check if email confirmation is needed
        if (data.user.needsEmailConfirmation) {
          router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
        } else {
          // Direct to onboarding if no email confirmation needed
          router.push("/onboarding")
        }
      }

    } catch (err: any) {
      console.error("Sign up error:", err)
      setError(err.message || "Er is een fout opgetreden bij het aanmelden")
    } finally {
      setLoading(false)
    }
  }

  const getUserTypeInfo = (type: string) => {
    switch (type) {
      case "family":
        return {
          label: "Familie",
          description: "Ik moet een uitvaart regelen voor een dierbare",
          icon: Users,
          color: "text-blue-600"
        }
      case "director":
        return {
          label: "Uitvaartondernemer",
          description: "Ik ben een uitvaartondernemer en help families",
          icon: Building2,
          color: "text-purple-600"
        }
      case "venue":
        return {
          label: "Locatie-eigenaar",
          description: "Ik verhuur locaties voor uitvaarten",
          icon: MapPin,
          color: "text-green-600"
        }
      default:
        return {
          label: "",
          description: "",
          icon: Users,
          color: "text-gray-600"
        }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Flower2 className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-serif">Account aanmaken</CardTitle>
          <p className="text-slate-600">Maak uw Farewelly account aan</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* OAuth Buttons */}
            {(isGoogleConfigured || isLinkedInConfigured) && (
              <div className="space-y-3">
                {/* Google OAuth Button */}
                {isGoogleConfigured && (
                  <Button
                    type="button"
                    onClick={() => handleOAuthSignUp("google")}
                    disabled={loading || oauthLoading !== null}
                    className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
                    size="lg"
                  >
                    {oauthLoading === "google" ? (
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
                    Aanmelden met Google
                  </Button>
                )}

                {/* LinkedIn OAuth Button */}
                {isLinkedInConfigured && (
                  <Button
                    type="button"
                    onClick={() => handleOAuthSignUp("linkedin")}
                    disabled={loading || oauthLoading !== null}
                    className="w-full bg-[#0077B5] hover:bg-[#0066A0] text-white"
                    size="lg"
                  >
                    {oauthLoading === "linkedin" ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    )}
                    Aanmelden met LinkedIn
                  </Button>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Of met e-mail</span>
                  </div>
                </div>
              </div>
            )}

            {/* User Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Ik ben een:</Label>
              <RadioGroup
                value={formData.userType}
                onValueChange={(value) => handleInputChange("userType", value)}
                className="space-y-2"
              >
                {["family", "director", "venue"].map((type) => {
                  const info = getUserTypeInfo(type)
                  const Icon = info.icon
                  return (
                    <div key={type} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                      <RadioGroupItem value={type} id={type} />
                      <Icon className={`h-5 w-5 ${info.color}`} />
                      <div className="flex-1">
                        <Label htmlFor={type} className="text-sm font-medium cursor-pointer">
                          {info.label}
                        </Label>
                        <p className="text-xs text-slate-600 mt-1">{info.description}</p>
                      </div>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Volledige naam</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Voer uw naam in"
                required
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="voornaam@voorbeeld.nl"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Minimaal 6 karakters"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Wachtwoord bevestigen</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="Herhaal uw wachtwoord"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg" disabled={loading || oauthLoading !== null}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Account aanmaken...
                </>
              ) : (
                "Account aanmaken"
              )}
            </Button>

            {/* Sign In Link */}
            <div className="text-center pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Heeft u al een account?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-blue-600 hover:underline"
                  onClick={() => router.push("/auth")}
                >
                  Inloggen
                </Button>
              </p>
            </div>

            {/* Terms */}
            <div className="text-center">
              <p className="text-xs text-slate-500">
                Door een account aan te maken accepteert u onze{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  privacyvoorwaarden
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}