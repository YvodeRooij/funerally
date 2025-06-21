"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Phone,
  Users,
  Heart,
  AlertCircle,
  Lightbulb,
} from "lucide-react"

interface GuidedStep {
  id: string
  title: string
  description: string
  message: string
  options: Array<{
    id: string
    text: string
    description?: string
    action?: string
    urgent?: boolean
  }>
  completed?: boolean
}

const guidedSteps: GuidedStep[] = [
  {
    id: "welcome",
    title: "Welkom",
    description: "We begeleiden u stap voor stap",
    message:
      "Gecondoleerd met uw verlies. Wij zijn er om u te helpen tijdens deze moeilijke tijd. We gaan u stap voor stap begeleiden door alles wat geregeld moet worden.",
    options: [
      {
        id: "ready",
        text: "Ik ben er klaar voor",
        description: "Begin met de begeleiding",
      },
      {
        id: "questions",
        text: "Ik heb eerst vragen",
        description: "Stel uw vragen voordat we beginnen",
      },
    ],
  },
  {
    id: "immediate_needs",
    title: "Directe behoeften",
    description: "Wat heeft u nu het meest nodig?",
    message: "Laten we beginnen met wat u nu het meest nodig heeft. Kies wat het beste bij uw situatie past:",
    options: [
      {
        id: "first_steps",
        text: "Eerste stappen na overlijden",
        description: "Wat moet er direct geregeld worden?",
        urgent: true,
      },
      {
        id: "funeral_director",
        text: "Contact met uitvaartondernemer",
        description: "Hulp bij het vinden van de juiste ondernemer",
      },
      {
        id: "costs_insurance",
        text: "Kosten en verzekering",
        description: "Informatie over financiën en dekking",
      },
      {
        id: "documents",
        text: "Documenten regelen",
        description: "Hulp bij papierwerk en formaliteiten",
      },
    ],
  },
  {
    id: "action_plan",
    title: "Actieplan",
    description: "Uw persoonlijke stappenplan",
    message:
      "Op basis van uw keuze heb ik een persoonlijk stappenplan voor u gemaakt. Dit zijn de stappen die we samen gaan doorlopen:",
    options: [
      {
        id: "start_plan",
        text: "Laten we beginnen",
        description: "Start met het stappenplan",
      },
      {
        id: "modify_plan",
        text: "Ik wil iets aanpassen",
        description: "Pas het plan aan uw wensen aan",
      },
      {
        id: "save_later",
        text: "Bewaren voor later",
        description: "Ik wil dit later doen",
      },
    ],
  },
]

const actionPlans = {
  first_steps: [
    { task: "Overlijdensakte aanvragen", urgent: true, estimated: "1-2 dagen" },
    { task: "Familie en vrienden informeren", urgent: true, estimated: "Vandaag" },
    { task: "Uitvaartondernemer contacteren", urgent: true, estimated: "Binnen 24 uur" },
    { task: "Werkgever/instanties informeren", urgent: false, estimated: "Deze week" },
    { task: "Verzekering controleren", urgent: false, estimated: "Deze week" },
  ],
  funeral_director: [
    { task: "Uw wensen en budget bepalen", urgent: false, estimated: "30 minuten" },
    { task: "Geschikte ondernemers vinden", urgent: true, estimated: "1 uur" },
    { task: "Offertes vergelijken", urgent: false, estimated: "1-2 dagen" },
    { task: "Eerste gesprek plannen", urgent: true, estimated: "Vandaag" },
  ],
  costs_insurance: [
    { task: "Verzekeringspolis controleren", urgent: true, estimated: "30 minuten" },
    { task: "Kosten inschatting maken", urgent: false, estimated: "1 uur" },
    { task: "Financiële opties bekijken", urgent: false, estimated: "1-2 dagen" },
    { task: "Eventuele bijbetaling regelen", urgent: false, estimated: "Deze week" },
  ],
  documents: [
    { task: "Overlijdensakte verkrijgen", urgent: true, estimated: "1-2 dagen" },
    { task: "Identiteitspapieren verzamelen", urgent: true, estimated: "Vandaag" },
    { task: "Verzekeringspapieren zoeken", urgent: false, estimated: "1-2 dagen" },
    { task: "Testament/wilsbeschikking", urgent: false, estimated: "Deze week" },
  ],
}

export function GuidedSupport() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [currentPlan, setCurrentPlan] = useState<string>("")

  const progress = ((currentStep + 1) / guidedSteps.length) * 100

  const handleOptionSelect = (stepId: string, optionId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [stepId]: optionId }))

    if (stepId === "immediate_needs") {
      setCurrentPlan(optionId)
    }

    if (currentStep < guidedSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentStepData = guidedSteps[currentStep]
  const selectedPlan = currentPlan ? actionPlans[currentPlan as keyof typeof actionPlans] : []

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Heart className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-serif font-bold text-slate-900">Digitale Begeleiding</h1>
        </div>
        <p className="text-lg text-slate-600">We begeleiden u stap voor stap door dit proces</p>
      </div>

      {/* Progress */}
      <Card className="mb-6 border-purple-200 bg-purple-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Stap {currentStep + 1} van {guidedSteps.length}: {currentStepData.title}
            </h2>
            <Badge className="bg-purple-100 text-purple-800">{Math.round(progress)}% voltooid</Badge>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-slate-600 mt-2">{currentStepData.description}</p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Step Message */}
                <div className="text-center mb-8">
                  <div className="bg-slate-50 rounded-lg p-6 mb-6">
                    <p className="text-lg text-slate-800 leading-relaxed">{currentStepData.message}</p>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-4">
                  {currentStepData.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(currentStepData.id, option.id)}
                      className="w-full text-left border border-slate-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900">{option.text}</h3>
                            {option.urgent && <Badge className="bg-red-100 text-red-800 text-xs">Urgent</Badge>}
                          </div>
                          {option.description && <p className="text-sm text-slate-600">{option.description}</p>}
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Action Plan Preview */}
                {currentStep === 2 && selectedPlan.length > 0 && (
                  <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Uw persoonlijke stappenplan:</h3>
                    <div className="space-y-3">
                      {selectedPlan.map((task, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              task.urgent ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{task.task}</p>
                            <p className="text-sm text-slate-600">Geschatte tijd: {task.estimated}</p>
                          </div>
                          {task.urgent && <AlertCircle className="h-4 w-4 text-red-600" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Uw voortgang</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {guidedSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3">
                    {index < currentStep ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : index === currentStep ? (
                      <Clock className="h-5 w-5 text-blue-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-slate-300 rounded-full" />
                    )}
                    <span className={`text-sm ${index <= currentStep ? "text-slate-900" : "text-slate-500"}`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Directe hulp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Bel ons direct
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Checklist downloaden
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Familie informeren
              </Button>
            </CardContent>
          </Card>

          {/* Tip */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                <Lightbulb className="h-5 w-5" />
                Belangrijk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700">
                U hoeft niet alles in één keer te doen. Neem de tijd die u nodig heeft en vraag om hulp wanneer dat
                nodig is.
              </p>
            </CardContent>
          </Card>

          {/* Emergency */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-lg text-red-800">24/7 Hulplijn</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700 mb-3">Voor urgente vragen</p>
              <Button className="w-full bg-red-600 hover:bg-red-700">
                <Phone className="h-4 w-4 mr-2" />
                020-1234567
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Vorige
        </Button>

        <div className="text-sm text-slate-500">Uw voortgang wordt automatisch opgeslagen</div>
      </div>
    </div>
  )
}
