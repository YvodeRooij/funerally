"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Heart, ArrowRight, Loader2 } from "lucide-react"

export function FamilyOnboarding() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    zipCode: "",
    city: "",
    notes: ""
  })

  const totalSteps = 2

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      // Update user profile with onboarding data
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userType: "family",
          onboardingComplete: true
        }),
      })

      if (response.ok) {
        // Update session to reflect completed onboarding
        await update({
          onboardingComplete: true
        })
        
        // Redirect to intake wizard
        router.push("/start")
      }
    } catch (error) {
      console.error("Onboarding error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <Heart className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h1 className="text-3xl font-serif font-bold text-slate-900">Welkom bij Farewelly</h1>
          <p className="text-slate-600 mt-2">We zijn er om u te ondersteunen in deze moeilijke tijd</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {currentStep === 1 ? "Persoonlijke informatie" : "Voorkeuren instellen"}
                </CardTitle>
                <CardDescription>
                  {currentStep === 1 
                    ? "Vertel ons wie u bent zodat we u beter kunnen helpen"
                    : "Laatste stap voordat we beginnen met de intake"}
                </CardDescription>
              </div>
              <div className="text-sm text-slate-600">
                Stap {currentStep} van {totalSteps}
              </div>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="mt-4" />
          </CardHeader>
          
          <CardContent className="space-y-4">
            {currentStep === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Voornaam *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Uw voornaam"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Achternaam *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Uw achternaam"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefoonnummer *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="06-12345678"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adres</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Straat en huisnummer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Postcode</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange("zipCode", e.target.value)}
                      placeholder="1234 AB"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Plaats</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Uw woonplaats"
                    />
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-2">
                      ✨ Wat gebeurt er hierna?
                    </h3>
                    <ul className="space-y-2 text-sm text-purple-800">
                      <li>• We beginnen met een intake formulier</li>
                      <li>• U kunt op uw eigen tempo alle informatie invullen</li>
                      <li>• Onze AI-assistent helpt u bij elke stap</li>
                      <li>• Alles wordt automatisch opgeslagen</li>
                      <li>• Uw informatie wordt veilig gedeeld met passende uitvaartondernemers</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Is er iets dat we nu al moeten weten? (optioneel)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Bijvoorbeeld urgentie, speciale omstandigheden, etc."
                      rows={4}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      💙 We begrijpen dat dit een emotionele tijd is. Neem alle tijd die u nodig heeft. 
                      U kunt altijd pauzeren en later verder gaan.
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Vorige
              </Button>
              
              {currentStep === totalSteps ? (
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="bg-purple-700 hover:bg-purple-800"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Even geduld...
                    </>
                  ) : (
                    <>
                      Naar intake formulier
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Volgende stap
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}