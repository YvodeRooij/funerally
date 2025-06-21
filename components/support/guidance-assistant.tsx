"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Send,
  Mic,
  MicOff,
  Heart,
  Clock,
  Phone,
  Mail,
  HelpCircle,
} from "lucide-react"

interface GuidanceAssistantProps {
  currentStep: number
  stepName: string
  formData: any
}

export function GuidanceAssistant({ currentStep, stepName, formData }: GuidanceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [message, setMessage] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [hasBeenIdle, setHasBeenIdle] = useState(false)

  // Auto-show if user seems stuck (hasn't progressed in 2 minutes)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen && !hasBeenIdle) {
        setHasBeenIdle(true)
        setIsOpen(true)
      }
    }, 120000) // 2 minutes

    return () => clearTimeout(timer)
  }, [currentStep, isOpen, hasBeenIdle])

  const stepSuggestions = {
    0: [
      "Hoe vul ik de datum van overlijden in?",
      "Wat als ik niet alle gegevens heb?",
      "Kan ik later terugkomen om dit af te maken?",
    ],
    1: [
      "Wat is het verschil tussen crematie en begrafenis?",
      "Welke kosten zijn er aan verbonden?",
      "Kan ik later nog van gedachten veranderen?",
    ],
    2: ["Hoe kies ik de juiste locatie?", "Wat als ik het aantal gasten niet weet?", "Zijn er locaties in mijn buurt?"],
    3: [
      "Hoe werkt een uitvaartverzekering?",
      "Wat als ik geen verzekering heb?",
      "Welke financiële hulp is er beschikbaar?",
    ],
    4: [
      "Hoe kan ik culturele wensen aangeven?",
      "Wat zijn de mogelijkheden voor muziek?",
      "Kan ik speciale verzoeken doen?",
    ],
  }

  const currentSuggestions = stepSuggestions[currentStep as keyof typeof stepSuggestions] || []

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion)
    setShowSuggestions(false)
    // Here you would typically send to your support system
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle message sending
      console.log("Sending message:", message)
      setMessage("")
      setShowSuggestions(false)
    }
  }

  const toggleListening = () => {
    setIsListening(!isListening)
    // Here you would implement voice recognition
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
          size="lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        {hasBeenIdle && (
          <div className="absolute -top-12 -left-20 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg">
            Hulp nodig? Klik hier!
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card
        className={`w-96 shadow-2xl border-purple-200 transition-all duration-300 ${
          isMinimized ? "h-16" : "h-[500px]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-purple-50">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-full p-2">
              <Heart className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Persoonlijke Begeleiding</h3>
              <p className="text-xs text-slate-600">We zijn er om u te helpen</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)} className="h-8 w-8 p-0">
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[436px]">
            {/* Current Step Context */}
            <div className="p-4 bg-blue-50 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  Stap {currentStep + 1}
                </Badge>
                <span className="text-sm font-medium text-slate-900">{stepName}</span>
              </div>
              <p className="text-xs text-slate-600">
                Heeft u vragen over deze stap? Onze begeleiders staan klaar om u te helpen.
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              {showSuggestions && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 mb-3">Veelgestelde vragen bij deze stap:</p>
                  {currentSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left justify-start h-auto p-3 text-xs hover:bg-purple-50"
                    >
                      <HelpCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}

              {!showSuggestions && (
                <div className="space-y-4">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-sm text-purple-800">
                      Bedankt voor uw vraag. Een van onze begeleiders neemt binnen 2 minuten contact met u op.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    Gemiddelde reactietijd: 1-2 minuten
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-slate-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 flex items-center gap-2 bg-white rounded-lg border p-2">
                  <Input
                    placeholder="Typ uw vraag hier..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="border-0 p-0 focus-visible:ring-0"
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleListening}
                    className={`h-8 w-8 p-0 ${isListening ? "text-red-600" : "text-slate-400"}`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={handleSendMessage} size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Contact Options */}
              <div className="flex items-center justify-center gap-4 text-xs">
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  <Phone className="h-3 w-3 mr-1" />
                  Direct bellen
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  <Mail className="h-3 w-3 mr-1" />
                  Email sturen
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
