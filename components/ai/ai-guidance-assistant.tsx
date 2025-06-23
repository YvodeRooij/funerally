"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Send, Minimize2, Maximize2, Bot, Heart, Lightbulb, HelpCircle, Mic, MicOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
// Enhanced AI functionality with MCP tools and conversation saving
// 💾 CONVERSATION PERSISTENCE: All chat messages are automatically saved to provide:
//   - Personalized responses based on previous conversations
//   - Context-aware assistance across sessions  
//   - Data for generating comprehensive intake reports
//   - Better user experience through learned preferences
// 🔗 MCP INTEGRATION: AI agent uses Supabase MCP tools to access:
//   - Real venue locations and pricing data
//   - Available funeral service options
//   - User's conversation history for personalization
//   - Dynamic, data-driven responses instead of static templates

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
  intakeId?: string | null
  onSuggestionApply?: (suggestion: any) => void
}

export function AIGuidanceAssistant({ currentStep, stepName, formData, intakeId }: Omit<AIGuidanceAssistantProps, 'onSuggestionApply'>) {
  // Using the shared supabase client from lib/supabase.ts
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [chatHistory, setChatHistory] = useState<any[]>([])

  // Save message to database
  const saveMessageToHistory = useCallback(async (message: Message) => {
    if (!intakeId) return

    try {
      await supabase
        .from('intake_chat_history')
        .insert({
          intake_id: intakeId,
          message: message.content,
          type: message.type,
          context: {
            step: currentStep,
            stepName: stepName
          },
          created_at: message.timestamp.toISOString()
        })
    } catch (error) {
      console.error('Error saving chat message:', error)
    }
  }, [intakeId, currentStep, stepName, supabase])

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

  // Get AI response using API endpoint
  const getAIResponse = async (userMessage: string) => {
    setIsTyping(true)

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          currentStep,
          stepName,
          formData,
          intakeId,
          chatHistory
        })
      })

      const data = await response.json()
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: "assistant",
        content: data.response || "Sorry, ik kon geen antwoord genereren. Probeer het opnieuw.",
        timestamp: new Date(),
        context: stepName,
      }

      setMessages((prev) => [...prev, aiMessage])
      // 💾 Note: Conversation is automatically saved by enhanced AI agent
      // This enables personalized responses in future conversations
      saveMessageToHistory(aiMessage)
      
      // Update chat history for context
      setChatHistory(prev => [
        ...prev,
        { type: 'user', content: userMessage },
        { type: 'assistant', content: data.response }
      ])
      
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      // Fallback response
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: "assistant",
        content: "Excuses, ik ondervind momenteel technische problemen. Kunt u uw vraag opnieuw stellen?",
        timestamp: new Date(),
        context: stepName,
      }
      
      setMessages((prev) => [...prev, errorMessage])
      saveMessageToHistory(errorMessage)
    } finally {
      setIsTyping(false)
    }
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

    await getAIResponse(inputValue)
  }

  const handleSuggestionClick = async (suggestion: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: suggestion,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    await getAIResponse(suggestion)
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
          Hulp nodig?
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
              {/* <h3 className="font-semibold text-slate-900">AI Uitvaart Assistent</h3> */}
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
                        <span className="text-xs font-medium text-purple-600">Farewelly Assistent</span>
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content.split('\n').map((line, i) => (
                        <p key={i} className={line.startsWith('•') || line.startsWith('-') ? 'ml-2' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
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
                      <span className="text-xs text-slate-600">Nadenken...</span>
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
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
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
                <div className="flex flex-col items-end text-xs text-slate-500">
                  <span>Powered by LangGraph JS + MCP</span>
                  <span className="text-[10px] opacity-75">💾 Gesprekken opgeslagen voor personalisatie</span>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
