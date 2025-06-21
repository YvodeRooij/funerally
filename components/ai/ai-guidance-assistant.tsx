"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Send, Minimize2, Maximize2, Bot, Heart, Lightbulb, HelpCircle, Mic, MicOff } from "lucide-react"

interface Message {
  id: string
  type: "user" | "assistant" | "suggestion"
  content: string
  timestamp: Date
  context?: string
}

interface AIGuidanceAssistantProps {
  currentStep: number
  stepName: string
  formData: any
  onSuggestionApply?: (suggestion: any) => void
}

export function AIGuidanceAssistant({ currentStep, stepName, formData, onSuggestionApply }: AIGuidanceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)

  // Context-aware suggestions based on current step
  const getContextualSuggestions = () => {
    switch (currentStep) {
      case 0:
        return [
          "Wat moet ik invullen als ik de exacte overlijdensdatum niet weet?",
          "Hoe weet ik welke relatie ik moet selecteren?",
          "Kan ik later nog gegevens aanpassen?",
        ]
      case 1:
        return [
          "Wat is het verschil tussen begrafenis en crematie?",
          "Welke optie past bij onze familie tradities?",
          "Kan ik meerdere opties combineren?",
        ]
      case 2:
        return [
          "Hoe schat ik het aantal gasten in?",
          "Wat als ik de locatie nog niet zeker weet?",
          "Welke locaties zijn beschikbaar in mijn gebied?",
        ]
      case 3:
        return [
          "Hoe controleer ik mijn verzekeringsdekking?",
          "Wat zijn de kosten van een gemiddelde uitvaart?",
          "Welke financiële hulp is er beschikbaar?",
        ]
      case 4:
        return [
          "Welke culturele tradities kan ik combineren?",
          "Hoe communiceer ik speciale wensen duidelijk?",
          "Wat als ik religieuze vereisten heb?",
        ]
      default:
        return ["Hoe kan ik u helpen?"]
    }
  }

  // Simulate AI response with LangGraph JS
  const simulateAIResponse = async (userMessage: string) => {
    setIsTyping(true)

    // Simulate API call to LangGraph JS
    await new Promise((resolve) => setTimeout(resolve, 1500))

    let response = ""

    // Context-aware responses based on current step and user input
    if (userMessage.toLowerCase().includes("overlijdensdatum")) {
      response =
        "Als u de exacte overlijdensdatum niet weet, kunt u de datum invullen die het dichtst bij de werkelijkheid ligt. Dit kan later altijd worden aangepast wanneer u de officiële documenten heeft. Het belangrijkste is dat we kunnen beginnen met de planning."
    } else if (userMessage.toLowerCase().includes("begrafenis") || userMessage.toLowerCase().includes("crematie")) {
      response =
        "Een begrafenis betekent dat de overledene wordt begraven op een begraafplaats. Een crematie betekent dat het lichaam wordt gecremeerd en u de as kunt meenemen of laten bijzetten. Beide opties kunnen worden gecombineerd met een plechtigheid. Ik kan u helpen de beste keuze te maken op basis van uw wensen en tradities."
    } else if (userMessage.toLowerCase().includes("kosten") || userMessage.toLowerCase().includes("prijs")) {
      response =
        "De kosten van een uitvaart variëren tussen €3.000 en €15.000, afhankelijk van uw keuzes. Een eenvoudige crematie kost gemiddeld €4.000-€6.000, een begrafenis €6.000-€10.000. Veel mensen hebben een uitvaartverzekering die een groot deel dekt. Ik kan u helpen uw verzekering te controleren."
    } else {
      response = `Ik begrijp uw vraag over "${userMessage}". Als AI-assistent gespecialiseerd in uitvaartplanning kan ik u helpen met alle aspecten van dit proces. Kunt u uw vraag iets specifieker stellen zodat ik u beter kan helpen?`
    }

    const aiMessage: Message = {
      id: Date.now().toString(),
      type: "assistant",
      content: response,
      timestamp: new Date(),
      context: stepName,
    }

    setMessages((prev) => [...prev, aiMessage])
    setIsTyping(false)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    await simulateAIResponse(inputValue)
  }

  const handleSuggestionClick = async (suggestion: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: suggestion,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    await simulateAIResponse(suggestion)
    setShowSuggestions(false)
  }

  // Auto-open assistant if user seems stuck (hasn't progressed in 30 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen && messages.length === 0) {
        setIsOpen(true)
        const welcomeMessage: Message = {
          id: "welcome",
          type: "assistant",
          content: `Hallo, ik ben uw AI-assistent voor uitvaartplanning. Ik zie dat u bezig bent met "${stepName}". Heeft u vragen of kan ik u ergens mee helpen?`,
          timestamp: new Date(),
          context: stepName,
        }
        setMessages([welcomeMessage])
      }
    }, 30000)

    return () => clearTimeout(timer)
  }, [currentStep, isOpen, messages.length, stepName])

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 rounded-full h-14 w-14 shadow-lg animate-pulse"
        >
          <Bot className="h-6 w-6" />
        </Button>
        <div className="absolute -top-12 right-0 bg-slate-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap">
          AI Hulp beschikbaar 🤖
        </div>
      </div>
    )
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
      }`}
    >
      <Card className="h-full shadow-2xl border-purple-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-purple-50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="h-6 w-6 text-purple-600" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">AI Uitvaart Assistent</h3>
              <p className="text-xs text-slate-600">Altijd hier om te helpen</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)}>
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[400px]">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === "user" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    {message.type === "assistant" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600">AI Assistent</span>
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString("nl-NL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-600">AI denkt na...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Contextual Suggestions */}
              {showSuggestions && messages.length <= 1 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Lightbulb className="h-4 w-4" />
                    <span>Veelgestelde vragen bij deze stap:</span>
                  </div>
                  {getContextualSuggestions().map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start h-auto p-3 text-wrap"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Stel uw vraag..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setIsListening(!isListening)}
                  >
                    {isListening ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={handleSendMessage} size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="secondary" className="text-xs">
                  Stap {currentStep + 1}: {stepName}
                </Badge>
                <span className="text-xs text-slate-500">Powered by LangGraph JS</span>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
