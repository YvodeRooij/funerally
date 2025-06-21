"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Phone, Calendar, FileText, Users, Lightbulb, CheckCircle, Clock } from "lucide-react"

const guidedSteps = [
  {
    id: "welcome",
    title: "Welkom",
    message: "Ik ga u stap voor stap begeleiden. We nemen alle tijd die u nodig heeft.",
    options: ["Ik ben er klaar voor", "Ik heb eerst vragen"],
  },
  {
    id: "immediate_needs",
    title: "Directe zaken",
    message: "Laten we beginnen met de meest urgente zaken. Wat heeft u nu het meest nodig?",
    options: [
      "Hulp bij eerste stappen na overlijden",
      "Contact met een uitvaartondernemer",
      "Informatie over kosten en verzekering",
      "Hulp bij het regelen van documenten",
    ],
  },
  {
    id: "next_steps",
    title: "Volgende stappen",
    message: "Goed, ik ga u helpen met [selected option]. Dit zijn de stappen die we samen gaan doorlopen:",
    options: ["Laten we beginnen", "Ik wil dit later doen"],
  },
]

export function FamilyChatInterface() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const currentStep = guidedSteps[currentStepIndex]
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleOptionClick = (option: string) => {
    setSelectedOption(option)
    if (currentStep.id === "immediate_needs") {
      // Logic to handle the selected option from immediate needs
      // For example, update the next_steps message based on the selection
    }
    if (currentStepIndex < guidedSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const progress = ((currentStepIndex + 1) / guidedSteps.length) * 100

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Heart className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-serif font-bold text-slate-900">Digitale Begeleiding</h1>
        </div>
        <p className="text-lg text-slate-600">Wij helpen u stap voor stap</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[700px] flex flex-col">
            {/* Chat Header */}
            <CardHeader className="border-b border-slate-200 pb-4">
              <CardTitle className="text-lg">Digitale Begeleider</CardTitle>
              <p className="text-sm text-slate-600">Uw persoonlijke gids</p>
              <div className="mt-2">
                <progress value={progress} max="100"></progress>
                <p className="text-xs text-slate-500 mt-1">
                  Stap {currentStepIndex + 1} van {guidedSteps.length}
                </p>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="mb-4">
                <p className="text-sm text-slate-700">{currentStep.message}</p>
              </div>

              {currentStep.options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleOptionClick(option)}
                >
                  {option}
                </Button>
              ))}
            </CardContent>

            {/* Input Area - Removed */}
          </Card>
        </div>

        {/* Sidebar - Quick Actions & Context */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Snelle acties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Planning bekijken
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Documenten
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Contacten
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Direct bellen
              </Button>
            </CardContent>
          </Card>

          {/* Current Context */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Huidige status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Intake voltooid</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Wachten op ondernemer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Digitale begeleider beschikbaar</span>
              </div>
            </CardContent>
          </Card>

          {/* Tips & Guidance */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                <Lightbulb className="h-5 w-5" />
                Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700">
                U hoeft niet alles in één keer te regelen. Neem de tijd die u nodig heeft en vraag om hulp wanneer u die
                nodig heeft.
              </p>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-lg text-red-800">Spoedhulp</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700 mb-3">Voor urgente zaken binnen 24 uur</p>
              <Button className="w-full bg-red-600 hover:bg-red-700">
                <Phone className="h-4 w-4 mr-2" />
                020-1234567
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Canvas for Visual Elements (Future LangGraph Integration) */}
    </div>
  )
}
