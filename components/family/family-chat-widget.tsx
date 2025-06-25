"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  HelpCircle,
  Send,
  X,
  Phone,
  User,
  Loader2,
  MessageCircle,
} from "lucide-react"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface QuickAction {
  label: string
  message: string
  icon?: any
}

interface ChatWidgetProps {
  isOpen: boolean
  onClose: () => void
  locale?: string
  userType?: 'family' | 'director' | 'venue'
}

export function FamilyChatWidget({ 
  isOpen, 
  onClose, 
  locale = 'nl',
  userType = 'family' 
}: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hallo! Hoe kan ik je helpen met het dashboard?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const quickActions: QuickAction[] = [
    { label: "Hoe verzend ik mijn gegevens?", message: "Hoe kan ik mijn uitvaartgegevens naar de ondernemer verzenden?" },
    { label: "Documenten uploaden", message: "Welke documenten moet ik uploaden en hoe doe ik dat?" },
    { label: "Contact ondernemer", message: "Hoe kan ik contact opnemen met mijn uitvaartondernemer?" },
    { label: "Wijzigingen maken", message: "Hoe kan ik mijn ingevoerde gegevens wijzigen?" },
    { label: "Status bijwerken", message: "Wat is de huidige status van mijn aanvraag?" },
  ]

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      // Call the dashboard help API
      const response = await fetch("/api/dashboard-help", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          context: {
            topic: selectedTopic,
            currentPage: `${userType}_dashboard`,
            userRole: userType,
          },
          chatHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userType: userType,
          locale: locale,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "Ik begrijp je vraag. Laat me je helpen met de juiste informatie.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Er is een fout opgetreden. Probeer het later opnieuw of bel onze hulplijn op 0800-1234567.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (action: QuickAction) => {
    setSelectedTopic(action.label)
    sendMessage(action.message)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col shadow-xl">
        {/* Header */}
        <CardHeader className="border-b bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Hulp & Ondersteuning</h3>
                <p className="text-sm text-purple-100">We helpen je graag verder</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {message.role === "user" ? (
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <HelpCircle className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === "user" ? "text-purple-200" : "text-gray-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString("nl-NL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <HelpCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="p-4 border-t">
            <p className="text-sm text-gray-600 mb-3">Veelgestelde vragen:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action)}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <CardContent className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Typ je vraag hier..."
              className="flex-1 min-h-[44px] max-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <Button type="submit" disabled={!inputMessage.trim() || isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Voor spoedvragen: 
              <Button
                variant="link"
                size="sm"
                className="text-xs text-purple-600 hover:text-purple-700 p-0 ml-1"
              >
                <Phone className="h-3 w-3 mr-1" />
                0800-1234567
              </Button>
            </p>
            <Badge variant="secondary" className="text-xs">
              <HelpCircle className="h-3 w-3 mr-1" />
              24/7 beschikbaar
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}