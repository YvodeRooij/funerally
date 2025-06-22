"use client"

/**
 * OFFLINE PAGE - Fallback page when network is unavailable
 *
 * Purpose: Provides helpful information when users are offline
 * Features: Cached content, retry options, emergency contacts
 * Critical: Ensures users can still access important information during network issues
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { WifiOff, RefreshCw, Phone, Heart } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="bg-slate-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <WifiOff className="h-8 w-8 text-slate-600" />
          </div>

          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-4">Geen internetverbinding</h1>

          <p className="text-slate-600 mb-6">
            U bent momenteel offline. Sommige functies zijn beperkt beschikbaar, maar u kunt nog steeds:
          </p>

          <div className="space-y-3 mb-6 text-left">
            <div className="flex items-center gap-3">
              <Heart className="h-4 w-4 text-purple-600" />
              <span className="text-sm">Eerder bekeken informatie raadplegen</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-purple-600" />
              <span className="text-sm">Noodcontacten bellen</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={() => window.location.reload()} className="w-full bg-purple-700 hover:bg-purple-800">
              <RefreshCw className="h-4 w-4 mr-2" />
              Opnieuw proberen
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <a href="tel:020-1234567">
                <Phone className="h-4 w-4 mr-2" />
                Noodhulp bellen
              </a>
            </Button>
          </div>

          <div className="mt-6 p-4 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Tip:</strong> Deze app werkt ook offline. Installeer de app voor de beste ervaring tijdens
              moeilijke momenten.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
