"use client"

/**
 * NOTIFICATION CENTER - ENHANCED UX
 *
 * Purpose: Clean, non-overlapping notification system
 * Features: Proper positioning, responsive design, clear hierarchy
 * UX: No content overlap, improved readability, mobile-optimized
 */
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, X, CheckCircle, AlertCircle, Clock, MessageSquare, Euro } from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "update" | "reminder" | "urgent" | "message" | "payment"
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionText?: string
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "urgent",
    title: "Documentverificatie vereist",
    message: "Uw overlijdensakte moet binnen 24 uur geverifieerd worden voor de uitvaart van morgen.",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    actionUrl: "/family/documents",
    actionText: "Document uploaden",
  },
  {
    id: "2",
    type: "message",
    title: "Bericht van Jan de Boer",
    message: "De bloemen zijn bevestigd voor morgen 13:00. Alles is gereed voor de dienst.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    actionUrl: "/family/chat",
    actionText: "Bericht bekijken",
  },
  {
    id: "3",
    type: "update",
    title: "Locatie bevestigd",
    message: "Westgaarde Crematorium heeft uw boeking voor 20 januari 14:00 bevestigd.",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: "4",
    type: "payment",
    title: "Commissie ontvangen",
    message: "Uw commissie van €150 voor de familie Jansen is verwerkt.",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    read: true,
    actionUrl: "/payments",
    actionText: "Details bekijken",
  },
]

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "message":
        return <MessageSquare className="h-4 w-4 text-blue-600" />
      case "update":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "reminder":
        return <Clock className="h-4 w-4 text-amber-600" />
      case "payment":
        return <Euro className="h-4 w-4 text-purple-600" />
      default:
        return <Bell className="h-4 w-4 text-slate-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "message":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "update":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "reminder":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
      case "payment":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes} min geleden`
    if (hours < 24) return `${hours} uur geleden`
    return `${days} dag${days > 1 ? "en" : ""} geleden`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs border-2 border-white dark:border-slate-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 z-50">
          <Card className="shadow-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Meldingen</CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                      Alles gelezen
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p>Geen nieuwe meldingen</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group",
                        !notification.read && "bg-blue-50/50 dark:bg-blue-950/20",
                      )}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4
                              className={cn(
                                "text-sm font-medium",
                                !notification.read
                                  ? "text-slate-900 dark:text-white"
                                  : "text-slate-700 dark:text-slate-300",
                              )}
                            >
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2 ml-2">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeNotification(notification.id)
                                }}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 dark:text-slate-500">
                              {formatTime(notification.timestamp)}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge className={cn("text-xs", getTypeColor(notification.type))}>
                                {notification.type === "urgent" && "Urgent"}
                                {notification.type === "message" && "Bericht"}
                                {notification.type === "update" && "Update"}
                                {notification.type === "reminder" && "Herinnering"}
                                {notification.type === "payment" && "Betaling"}
                              </Badge>
                              {notification.actionText && (
                                <Button size="sm" variant="outline" className="h-6 text-xs">
                                  {notification.actionText}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
