"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Flower2, AlertTriangle } from "lucide-react"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const errorParam = searchParams.get("error")
    
    // Map NextAuth error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      "Configuration": "Er is een configuratiefout opgetreden. Neem contact op met ondersteuning.",
      "AccessDenied": "Toegang geweigerd. U heeft de autorisatie geannuleerd of uw account heeft geen toegang.",
      "Verification": "Er is een verificatiefout opgetreden. Probeer opnieuw in te loggen.",
      "OAuthAccountNotLinked": "Dit account is al gekoppeld aan een andere aanmeldmethode. Probeer in te loggen met uw oorspronkelijke methode.",
      "OAuthCallback": "Er is een fout opgetreden tijdens het aanmelden. Probeer het opnieuw.",
      "OAuthCreateAccount": "Er is een fout opgetreden bij het aanmaken van uw account. Probeer het opnieuw.",
      "EmailCreateAccount": "Er is een fout opgetreden bij het aanmaken van uw account via e-mail.",
      "Callback": "Er is een fout opgetreden in de authenticatie callback.",
      "OAuthSignin": "Er is een fout opgetreden bij het aanmelden met OAuth.",
      "OAuthProfile": "Er kon geen gebruikersprofiel worden opgehaald van de OAuth provider.",
      "EmailSignin": "Er is een fout opgetreden bij het aanmelden via e-mail.",
      "CredentialsSignin": "Ongeldige inloggegevens. Controleer uw e-mailadres en wachtwoord.",
      "SessionRequired": "U moet ingelogd zijn om deze pagina te bekijken.",
      "Default": "Er is een onbekende fout opgetreden tijdens het aanmelden."
    }

    setError(errorMessages[errorParam || ""] || errorMessages["Default"])
  }, [searchParams])

  const handleRetry = () => {
    // Clear any pending user type from session storage
    sessionStorage.removeItem("pendingUserType")
    router.push("/auth")
  }

  const handleGoHome = () => {
    sessionStorage.removeItem("pendingUserType")
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-serif text-slate-900">Aanmeldingsfout</CardTitle>
          <p className="text-slate-600">Er is iets misgegaan tijdens het aanmelden</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              className="w-full"
              size="lg"
            >
              Opnieuw proberen
            </Button>
            
            <Button 
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Terug naar homepage
            </Button>
          </div>

          <div className="text-center pt-4 border-t border-slate-200">
            <div className="flex items-center justify-center mb-2">
              <Flower2 className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm text-slate-600 font-medium">Farewelly</span>
            </div>
            <p className="text-xs text-slate-500">
              Heeft u nog steeds problemen?{" "}
              <Link href="/contact" className="text-blue-600 hover:underline">
                Neem contact met ons op
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}