/**
 * PWA INSTALL PROMPT - Progressive Web App installation component
 *
 * Purpose: Encourages users to install the app for offline access during crisis
 * Features: Smart install prompting, offline functionality, mobile-optimized experience
 * Critical: Ensures platform works even with poor internet during emergencies
 *
 * Benefits for Funeral Context:
 * - Works offline during poor network conditions
 * - Quick access during emotional stress
 * - Native app-like experience on mobile
 * - Push notifications for urgent updates
 */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, X, Smartphone, Wifi, Clock } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setShowInstallPrompt(false)
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
  }

  if (isInstalled || !showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="border-blue-200 bg-blue-50 shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
              <Smartphone className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">App installeren</h3>
              <p className="text-sm text-blue-800 mb-3">
                Installeer onze app voor snelle toegang en offline gebruik tijdens moeilijke momenten.
              </p>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <Wifi className="h-3 w-3" />
                  <span>Werkt offline</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <Clock className="h-3 w-3" />
                  <span>Snelle toegang</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <Download className="h-3 w-3" />
                  <span>Geen app store nodig</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleInstall} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Download className="h-3 w-3 mr-1" />
                  Installeren
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowInstallPrompt(false)}>
                  Later
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowInstallPrompt(false)} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
