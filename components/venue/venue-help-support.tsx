"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HelpCircle, MessageSquare, Globe, Zap, CheckCircle } from "lucide-react"

interface HelpSupportProps {
  context?: string
  trigger?: React.ReactNode
}

// Mock help topics based on venue onboarding context
const helpTopics = {
  calendar: [
    {
      title: "Google Calendar koppelen",
      description: "Stap-voor-stap uitleg voor Google Calendar integratie",
      difficulty: "Makkelijk",
      time: "2 minuten",
    },
    {
      title: "Outlook synchronisatie",
      description: "Hoe u uw Outlook agenda koppelt aan het platform",
      difficulty: "Gemiddeld",
      time: "5 minuten",
    },
    {
      title: "WhatsApp Bot instellen",
      description: "Beschikbaarheid beheren via WhatsApp",
      difficulty: "Makkelijk",
      time: "3 minuten",
    },
  ],
  pricing: [
    {
      title: "Dynamische prijzen instellen",
      description: "Optimale prijsstrategie voor uw locatie",
      difficulty: "Gemiddeld",
      time: "10 minuten",
    },
    {
      title: "Seizoensprijzen configureren",
      description: "Prijzen aanpassen per seizoen of periode",
      difficulty: "Gevorderd",
      time: "15 minuten",
    },
  ],
  general: [
    {
      title: "Platform navigatie",
      description: "Hoe u het dashboard gebruikt",
      difficulty: "Makkelijk",
      time: "5 minuten",
    },
    {
      title: "Eerste boeking ontvangen",
      description: "Wat te doen bij uw eerste boekingsaanvraag",
      difficulty: "Makkelijk",
      time: "3 minuten",
    },
  ],
}

export function VenueHelpSupport({ context = "general", trigger }: HelpSupportProps) {
  const [isAIHelpOpen, setIsAIHelpOpen] = useState(false)
  const [aiHelpStatus, setAiHelpStatus] = useState<"idle" | "connecting" | "connected">("idle")

  const currentTopics = helpTopics[context as keyof typeof helpTopics] || helpTopics.general

  const handleAIHelp = () => {
    setAiHelpStatus("connecting")
    // Simulate AI connection
    setTimeout(() => {
      setAiHelpStatus("connected")
    }, 2000)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Makkelijk":
        return "bg-green-100 text-green-800"
      case "Gemiddeld":
        return "bg-yellow-100 text-yellow-800"
      case "Gevorderd":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Hulp vragen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            Hulp & Ondersteuning
          </DialogTitle>
          <DialogDescription>Kies hoe u hulp wilt ontvangen bij het instellen van uw locatie</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Help Section */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">🤖 AI Assistent</h3>
                  <p className="text-blue-800 text-sm mb-4">
                    Onze AI-assistent kan uw scherm bekijken en u stap-voor-stap helpen met elke instelling. Perfect
                    voor complexe koppelingen zoals agenda-integratie.
                  </p>

                  {aiHelpStatus === "idle" && (
                    <Button onClick={handleAIHelp} className="bg-blue-600 hover:bg-blue-700">
                      <Zap className="h-4 w-4 mr-2" />
                      Start AI Hulp
                    </Button>
                  )}

                  {aiHelpStatus === "connecting" && (
                    <div className="flex items-center gap-2 text-blue-700">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      Verbinding maken met AI assistent...
                    </div>
                  )}

                  {aiHelpStatus === "connected" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        AI Assistent is verbonden en kan uw scherm zien
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-sm text-slate-700">
                          <strong>AI:</strong> Ik zie dat u bezig bent met het instellen van uw locatie. Waar kan ik u
                          mee helpen? Ik kan uw agenda-instellingen bekijken en u door het koppelingsproces leiden.
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        💬 Reageren op AI
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Help Topics */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Snelle hulp onderwerpen</h3>
            <div className="space-y-3">
              {currentTopics.map((topic, index) => (
                <Card key={index} className="hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 mb-1">{topic.title}</h4>
                        <p className="text-sm text-slate-600 mb-2">{topic.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={getDifficultyColor(topic.difficulty)}>{topic.difficulty}</Badge>
                          <span className="text-xs text-slate-500">⏱️ {topic.time}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Bekijken
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Options */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-slate-900 mb-4">Andere hulpopties</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-slate-900">Live Chat</h4>
                      <p className="text-sm text-slate-600">Direct contact met support</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-slate-900">WhatsApp</h4>
                      <p className="text-sm text-slate-600">+31 6 1234 5678</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
