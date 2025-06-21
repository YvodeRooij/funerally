/**
 * PUSH NOTIFICATIONS - Browser and mobile push notification system
 *
 * Purpose: Critical real-time communication for time-sensitive funeral coordination
 * Features: Browser push, mobile notifications, urgent alerts, permission management
 * Critical: Ensures families receive urgent updates even when app is closed
 *
 * Notification Types:
 * - Urgent: Document deadlines, ceremony changes
 * - Updates: Status changes, confirmations
 * - Reminders: Appointments, tasks
 * - Messages: Communication from funeral directors
 */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, BellOff, AlertCircle, CheckCircle, X } from "lucide-react"

interface PushNotificationProps {
  onPermissionChange?: (permission: NotificationPermission) => void
}

export function PushNotifications({ onPermissionChange }: PushNotificationProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported("Notification" in window && "serviceWorker" in navigator)

    if ("Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    // Show permission prompt for new users after 30 seconds
    const timer = setTimeout(() => {
      if (permission === "default" && isSupported) {
        setShowPermissionPrompt(true)
      }
    }, 30000)

    return () => clearTimeout(timer)
  }, [permission, isSupported])

  const requestPermission = async () => {
    if (!isSupported) return

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      onPermissionChange?.(result)
      setShowPermissionPrompt(false)

      if (result === "granted") {
        // Register service worker for push notifications
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.register("/sw.js")
          console.log("Service Worker registered:", registration)
        }

        // Show welcome notification
        new Notification("Meldingen ingeschakeld", {
          body: "U ontvangt nu belangrijke updates over uw uitvaart.",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: "welcome",
        })
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
    }
  }

  const sendTestNotification = () => {
    if (permission === "granted") {
      new Notification("Test melding", {
        body: "Dit is een test van het meldingssysteem.",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "test",
      })
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <>
      {/* Permission Status Indicator */}
      <div className="flex items-center gap-2">
        {permission === "granted" ? (
          <div className="flex items-center gap-2 text-green-600">
            <Bell className="h-4 w-4" />
            <span className="text-sm">Meldingen aan</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500">
            <BellOff className="h-4 w-4" />
            <span className="text-sm">Meldingen uit</span>
          </div>
        )}

        {permission === "granted" && (
          <Button variant="ghost" size="sm" onClick={sendTestNotification}>
            Test
          </Button>
        )}
      </div>

      {/* Permission Request Prompt */}
      {showPermissionPrompt && permission === "default" && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <Card className="border-amber-200 bg-amber-50 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-1">Belangrijke meldingen</h3>
                  <p className="text-sm text-amber-800 mb-3">
                    Sta meldingen toe om belangrijke updates over uw uitvaart te ontvangen, zoals:
                  </p>

                  <div className="space-y-1 mb-3 text-xs text-amber-700">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" />
                      <span>Urgente documentverzoeken</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      <span>Bevestigingen van afspraken</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell className="h-3 w-3" />
                      <span>Berichten van uw begeleider</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={requestPermission} size="sm" className="bg-amber-600 hover:bg-amber-700">
                      Meldingen toestaan
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowPermissionPrompt(false)}>
                      Niet nu
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPermissionPrompt(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

// Utility function to send push notifications
export const sendPushNotification = (title: string, options: NotificationOptions = {}) => {
  if ("Notification" in window && Notification.permission === "granted") {
    return new Notification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      ...options,
    })
  }
  return null
}

// Predefined notification templates for funeral context
export const FuneralNotifications = {
  urgentDocument: (documentName: string, deadline: string) =>
    sendPushNotification("Urgent: Document vereist", {
      body: `${documentName} moet voor ${deadline} worden geüpload.`,
      tag: "urgent-document",
      requireInteraction: true,
    }),

  appointmentReminder: (appointment: string, time: string) =>
    sendPushNotification("Afspraak herinnering", {
      body: `${appointment} om ${time}`,
      tag: "appointment",
    }),

  statusUpdate: (message: string) =>
    sendPushNotification("Status update", {
      body: message,
      tag: "status-update",
    }),

  newMessage: (sender: string, preview: string) =>
    sendPushNotification(`Nieuw bericht van ${sender}`, {
      body: preview,
      tag: "new-message",
    }),
}
