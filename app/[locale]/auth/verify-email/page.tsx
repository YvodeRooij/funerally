"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Flower2, Mail, RefreshCw } from "lucide-react"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleResendEmail = async () => {
    if (!email) {
      setError("Geen e-mailadres gevonden")
      return
    }

    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        throw error
      }

      setMessage("Bevestigingsmail opnieuw verzonden!")
    } catch (err: any) {
      setError(err.message || "Er is een fout opgetreden")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-serif">Controleer uw e-mail</CardTitle>
          <p className="text-slate-600">We hebben een bevestigingslink verstuurd</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center mb-4">
              <Flower2 className="h-6 w-6 text-blue-600 mr-2" />
              <span className="font-semibold text-slate-900">Farewelly</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg text-left">
              <p className="text-sm text-slate-700 mb-2">
                <strong>Bevestigingsmail verzonden naar:</strong>
              </p>
              <p className="text-sm font-mono text-blue-600 break-all">{email}</p>
            </div>

            <div className="text-sm text-slate-600 space-y-2">
              <p>Klik op de link in de e-mail om uw account te activeren.</p>
              <p>Controleer ook uw spam/ongewenste mail map.</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              disabled={loading || !email}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Bezig met versturen...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  E-mail opnieuw versturen
                </>
              )}
            </Button>

            <div className="text-center pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Verkeerd e-mailadres?{" "}
                <Link href="/signup" className="text-blue-600 hover:underline">
                  Opnieuw proberen
                </Link>
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-500">
              Als u problemen ondervindt, neem dan contact met ons op via{" "}
              <a href="mailto:support@farewelly.nl" className="text-blue-600 hover:underline">
                support@farewelly.nl
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}