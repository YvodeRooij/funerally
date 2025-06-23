"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Save, Heart, Check, Loader2 } from "lucide-react"
import { AIGuidanceAssistant } from "@/components/ai/ai-guidance-assistant"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { debounce } from "lodash"
import { isDemoMode, createDemoSession, getDemoModeInfo } from "@/lib/demo-mode"

interface FormData {
  deceasedName: string
  dateOfDeath: string
  relationship: string
  serviceType: string
  location: string
  attendees: string
  budget: string
  culturalRequirements: string[]
  hasInsurance: string
  insuranceProvider: string
  needsFinancialHelp: string
  gemeente: string
  specialRequests: string
}

const steps = [
  { id: "basic", title: "Basisgegevens", description: "Wie is er overleden?" },
  { id: "service", title: "Type uitvaart", description: "Hoe wilt u afscheid nemen?" },
  { id: "logistics", title: "Praktische zaken", description: "Waar en met hoeveel mensen?" },
  { id: "financial", title: "Financiën", description: "Verzekering en budget" },
  { id: "cultural", title: "Persoonlijke wensen", description: "Tradities en speciale verzoeken" },
]

export function IntakeWizard() {
  const { data: session } = useSession()
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // TODO PRODUCTION: Remove demo session - use only real session
  const effectiveSession = session || (isDemoMode() ? createDemoSession('family') : null)
  
  const [currentStep, setCurrentStep] = useState(0)
  const [intakeId, setIntakeId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    deceasedName: "",
    dateOfDeath: "",
    relationship: "",
    serviceType: "",
    location: "",
    attendees: "",
    budget: "",
    culturalRequirements: [],
    hasInsurance: "",
    insuranceProvider: "",
    needsFinancialHelp: "",
    gemeente: "",
    specialRequests: "",
  })

  const progress = ((currentStep + 1) / steps.length) * 100

  // Load existing intake on mount
  useEffect(() => {
    const loadExistingIntake = async () => {
      // TODO PRODUCTION: Remove demo mode handling - use only real session
      if (isDemoMode() && !session?.user?.id) {
        console.log('🎭 Demo: Loading demo intake data')
        setIntakeId('demo-intake-123')
        
        // Restore saved demo data from localStorage
        const savedDemoData = localStorage.getItem('demo-intake-data')
        if (savedDemoData) {
          try {
            const { formData: savedFormData, currentStep: savedStep, lastSaved } = JSON.parse(savedDemoData)
            setFormData(savedFormData)
            setCurrentStep(savedStep)
            setLastSaved(new Date(lastSaved))
            console.log('🔄 Demo: Restored saved form data')
          } catch (error) {
            console.error('Error parsing saved demo data:', error)
          }
        }
        return
      }
      
      if (!session?.user?.id) return

      const { data: existingIntake } = await supabase
        .from('family_intakes')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingIntake) {
        setIntakeId(existingIntake.id)
        setFormData(existingIntake.form_data)
        setCurrentStep(existingIntake.current_step || 0)
        setLastSaved(new Date(existingIntake.updated_at))
      } else {
        // Create new intake
        const { data: newIntake } = await supabase
          .from('family_intakes')
          .insert({
            user_id: session.user.id,
            form_data: formData,
            current_step: 0,
            completed: false
          })
          .select()
          .single()

        if (newIntake) {
          setIntakeId(newIntake.id)
        }
      }
    }

    loadExistingIntake()
  }, [session])

  // Auto-save function - works in both demo and production mode
  const autoSave = useCallback(async () => {
    if (!intakeId || !effectiveSession?.user?.id) return

    setSaveStatus("saving")

    try {
      // Demo mode: Save to localStorage for persistence
      if (isDemoMode() && !session?.user?.id) {
        console.log('🎭 Demo: Auto-saving to localStorage')
        localStorage.setItem('demo-intake-data', JSON.stringify({
          formData,
          currentStep,
          lastSaved: new Date().toISOString()
        }))
        setSaveStatus("saved")
        setLastSaved(new Date())
        setTimeout(() => setSaveStatus("idle"), 2000)
        return
      }

      // Production mode: Save to database
      const { error } = await supabase
        .from('family_intakes')
        .update({
          form_data: formData,
          current_step: currentStep,
          updated_at: new Date().toISOString()
        })
        .eq('id', intakeId)

      if (!error) {
        setSaveStatus("saved")
        setLastSaved(new Date())
        setTimeout(() => setSaveStatus("idle"), 2000)
      } else {
        setSaveStatus("error")
      }
    } catch (error) {
      console.error("Auto-save error:", error)
      setSaveStatus("error")
    }
  }, [intakeId, formData, currentStep, effectiveSession, session])

  // Debounced auto-save
  const debouncedAutoSave = useCallback(
    debounce(autoSave, 2000),
    [autoSave]
  )

  // Trigger auto-save on form changes
  useEffect(() => {
    if (intakeId) {
      debouncedAutoSave()
    }
  }, [formData, currentStep, intakeId, debouncedAutoSave])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCulturalRequirementChange = (requirement: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      culturalRequirements: checked
        ? [...prev.culturalRequirements, requirement]
        : prev.culturalRequirements.filter((r) => r !== requirement),
    }))
  }

  const handleGenerateReport = async () => {
    if (!intakeId || !effectiveSession?.user?.id) return

    setIsGeneratingReport(true)

    try {
      // First, ensure final save in both modes
      await autoSave()

      // Demo mode: Save to localStorage and use demo API with real LangGraph logic
      if (isDemoMode() && !session?.user?.id) {
        console.log('🎭 Demo: Generating report with real LangGraph logic')
        
        // Save completed state to localStorage
        localStorage.setItem('demo-intake-data', JSON.stringify({
          formData,
          currentStep,
          completed: true,
          completed_at: new Date().toISOString(),
          lastSaved: new Date().toISOString()
        }))

        // Use demo API but with real LangGraph processing
        const response = await fetch('/api/demo/generate-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            intakeId,
            formData,
            userId: effectiveSession.user.id,
            useLangGraph: true // Flag to ensure real AI processing
          })
        })

        if (response.ok) {
          const result = await response.json()
          console.log('✅ Demo report generated with LangGraph:', result)
          router.push(`/family`)
        } else {
          const error = await response.json()
          console.error('❌ Demo report failed:', error)
          setSaveStatus("error")
        }
        return
      }

      // Production mode: Save to database and use production API with LangGraph
      console.log('🏭 Production: Generating report with LangGraph logic')
      
      // Mark intake as completed in database
      await supabase
        .from('family_intakes')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', intakeId)

      // Generate report via production API with LangGraph
      const response = await fetch('/api/generate-intake-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intakeId,
          formData,
          userId: effectiveSession.user.id
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Production report generated with LangGraph:', result)
        router.push(`/family`)
      } else {
        const error = await response.json()
        console.error('❌ Production report failed:', error)
        setSaveStatus("error")
      }
    } catch (error) {
      console.error('Error generating report:', error)
      setSaveStatus("error")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* TODO PRODUCTION: Remove demo mode indicator */}
      {isDemoMode() && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-600">⚠️</span>
            <span className="text-amber-800 text-sm font-medium">Demo Mode Active</span>
            <span className="text-amber-700 text-xs">- Using mock data for testing</span>
          </div>
        </div>
      )}
      {/* Progress Header */}
      <Card className="mb-6 border-purple-200 bg-purple-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Stap {currentStep + 1} van {steps.length}: {steps[currentStep].title}
              </h2>
              <p className="text-slate-600">{steps[currentStep].description}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-blue-600">Opslaan...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Opgeslagen</span>
                </>
              )}
              {saveStatus === "idle" && lastSaved && (
                <>
                  <Save className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-500">
                    Laatst opgeslagen {lastSaved.toLocaleTimeString("nl-NL", { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    })}
                  </span>
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <Save className="h-4 w-4 text-red-600" />
                  <span className="text-red-600">Opslaan mislukt</span>
                </>
              )}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="p-8">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Heart className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <p className="text-slate-600">We beginnen met enkele basisgegevens. Neem de tijd die u nodig heeft.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="deceasedName" className="text-base">
                    Naam van de overledene
                  </Label>
                  <Input
                    id="deceasedName"
                    value={formData.deceasedName}
                    onChange={(e) => handleInputChange("deceasedName", e.target.value)}
                    className="mt-2"
                    placeholder="Voor- en achternaam"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfDeath" className="text-base">
                    Datum van overlijden
                  </Label>
                  <Input
                    id="dateOfDeath"
                    type="date"
                    value={formData.dateOfDeath}
                    onChange={(e) => handleInputChange("dateOfDeath", e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-base">Uw relatie tot de overledene</Label>
                  <RadioGroup
                    value={formData.relationship}
                    onValueChange={(value) => handleInputChange("relationship", value)}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="partner" id="partner" />
                      <Label htmlFor="partner">Partner/echtgenoot</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="child" id="child" />
                      <Label htmlFor="child">Kind</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="parent" id="parent" />
                      <Label htmlFor="parent">Ouder</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sibling" id="sibling" />
                      <Label htmlFor="sibling">Broer/zus</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Anders</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base">Hoe wilt u afscheid nemen?</Label>
                <RadioGroup
                  value={formData.serviceType}
                  onValueChange={(value) => handleInputChange("serviceType", value)}
                  className="mt-4 space-y-4"
                >
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="burial" id="burial" />
                      <Label htmlFor="burial" className="font-medium">
                        Begrafenis
                      </Label>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 ml-6">Traditionele begrafenis op een begraafplaats</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cremation" id="cremation" />
                      <Label htmlFor="cremation" className="font-medium">
                        Crematie
                      </Label>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 ml-6">Crematie met mogelijkheid tot plechtigheid</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="memorial" id="memorial" />
                      <Label htmlFor="memorial" className="font-medium">
                        Herdenkingsdienst
                      </Label>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 ml-6">Alleen een dienst ter nagedachtenis</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unsure" id="unsure" />
                      <Label htmlFor="unsure" className="font-medium">
                        Nog niet zeker
                      </Label>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 ml-6">We helpen u de beste keuze te maken</p>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="location" className="text-base">
                  Gewenste locatie (stad/regio)
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="mt-2"
                  placeholder="Bijvoorbeeld: Amsterdam, Rotterdam"
                />
              </div>

              <div>
                <Label className="text-base">Verwacht aantal gasten</Label>
                <RadioGroup
                  value={formData.attendees}
                  onValueChange={(value) => handleInputChange("attendees", value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0-25" id="small" />
                    <Label htmlFor="small">0-25 personen (intiem)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="25-50" id="medium" />
                    <Label htmlFor="medium">25-50 personen (familie)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="50-100" id="large" />
                    <Label htmlFor="large">50-100 personen (uitgebreid)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="100+" id="very-large" />
                    <Label htmlFor="very-large">100+ personen (gemeenschap)</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base">Heeft u een uitvaartverzekering?</Label>
                <RadioGroup
                  value={formData.hasInsurance}
                  onValueChange={(value) => handleInputChange("hasInsurance", value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="insurance-yes" />
                    <Label htmlFor="insurance-yes">Ja</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="insurance-no" />
                    <Label htmlFor="insurance-no">Nee</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unsure" id="insurance-unsure" />
                    <Label htmlFor="insurance-unsure">Niet zeker</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.hasInsurance === "yes" && (
                <div>
                  <Label htmlFor="insuranceProvider" className="text-base">
                    Bij welke verzekeraar?
                  </Label>
                  <Input
                    id="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={(e) => handleInputChange("insuranceProvider", e.target.value)}
                    className="mt-2"
                    placeholder="Bijvoorbeeld: DELA, Monuta, Yarden"
                  />
                </div>
              )}

              <div>
                <Label className="text-base">Heeft u financiële ondersteuning nodig?</Label>
                <RadioGroup
                  value={formData.needsFinancialHelp}
                  onValueChange={(value) => handleInputChange("needsFinancialHelp", value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="help-no" />
                    <Label htmlFor="help-no">Nee, we kunnen het zelf betalen</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gemeente" id="help-gemeente" />
                    <Label htmlFor="help-gemeente">Mogelijk gemeentelijke uitvaart</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="assistance" id="help-assistance" />
                    <Label htmlFor="help-assistance">Hulp bij financiering gewenst</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.needsFinancialHelp === "gemeente" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm mb-3">
                    We kunnen u helpen met een gemeentelijke uitvaart voor €50 platformkosten.
                  </p>
                  <div>
                    <Label htmlFor="gemeente" className="text-base">
                      In welke gemeente?
                    </Label>
                    <Input
                      id="gemeente"
                      value={formData.gemeente}
                      onChange={(e) => handleInputChange("gemeente", e.target.value)}
                      className="mt-2"
                      placeholder="Naam van de gemeente"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base">Culturele of religieuze tradities</Label>
                <p className="text-sm text-slate-600 mt-1 mb-4">
                  Selecteer wat van toepassing is (meerdere opties mogelijk)
                </p>

                <div className="space-y-3">
                  {[
                    "Islamitische tradities",
                    "Joodse tradities",
                    "Hindoeïstische tradities",
                    "Christelijke tradities",
                    "Boeddhistische tradities",
                    "Humanistische ceremonie",
                    "Geen specifieke tradities",
                  ].map((requirement) => (
                    <div key={requirement} className="flex items-center space-x-2">
                      <Checkbox
                        id={requirement}
                        checked={formData.culturalRequirements.includes(requirement)}
                        onCheckedChange={(checked) => handleCulturalRequirementChange(requirement, checked as boolean)}
                      />
                      <Label htmlFor={requirement}>{requirement}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="specialRequests" className="text-base">
                  Speciale wensen of verzoeken
                </Label>
                <Textarea
                  id="specialRequests"
                  value={formData.specialRequests}
                  onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                  className="mt-2"
                  placeholder="Bijvoorbeeld: specifieke muziek, bloemen, sprekers, toegankelijkheid..."
                  rows={4}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Vorige
        </Button>

        {currentStep === steps.length - 1 ? (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-800 mb-2">🤖 AI Rapport Generatie</h4>
              <p className="text-purple-700 text-sm mb-3">
                Onze AI-assistent analyseert uw gegevens en maakt een gedetailleerd rapport voor uitvaartondernemers.
                Dit rapport is alleen toegankelijk via het platform en kan niet gekopieerd worden.
              </p>
              <div className="flex items-center gap-2 text-sm text-purple-600">
                <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                LangGraph JS analyseert uw wensen...
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">📄 Volgende stap: Documenten</h4>
              <p className="text-blue-700 text-sm">
                Na het rapport kunt u direct documenten uploaden zoals overlijdensakte en verzekeringspapieren.
              </p>
            </div>
            <Button 
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="bg-purple-700 hover:bg-purple-800 flex items-center gap-2 w-full"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rapport genereren...
                </>
              ) : (
                <>
                  🔒 Veilig Rapport Genereren & Documenten Uploaden
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button onClick={handleNext} className="bg-purple-700 hover:bg-purple-800 flex items-center gap-2">
            Volgende
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Help Section */}
      <Card className="mt-6 border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <p className="text-amber-800 text-sm">
            <strong>Hulp nodig?</strong> U kunt altijd contact opnemen via WhatsApp (06-12345678) of email
            (hulp@platform.nl). We zijn er om u te helpen.
          </p>
        </CardContent>
      </Card>

      {/* AI Guidance Assistant */}
      <AIGuidanceAssistant 
        currentStep={currentStep} 
        stepName={steps[currentStep].title} 
        formData={formData}
        intakeId={intakeId}
      />
    </div>
  )
}
