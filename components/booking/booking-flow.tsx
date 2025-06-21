"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  CreditCard,
  Shield,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Euro,
  Calendar,
  Users,
  Heart,
} from "lucide-react"

// Mock data for booking flow
const mockBookingData = {
  funeral: {
    deceased: "Henk van der Berg",
    serviceDate: "2024-01-20",
    serviceTime: "14:00",
    type: "Crematie",
  },
  director: {
    name: "Jan de Boer",
    company: "Uitvaartzorg De Boer",
    rating: 4.8,
    reviews: 127,
  },
  venue: {
    name: "Westgaarde Crematorium",
    address: "Westgaardeweg 1, Amsterdam",
    capacity: 150,
  },
  costs: {
    platformFee: 100,
    directorFee: 2500,
    venueFee: 450,
    cateringFee: 800,
    flowersFee: 300,
    total: 4150,
    insurance: 3500,
    finalAmount: 650,
  },
  hasCode: false,
  codeValue: "",
}

export function BookingFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [hasCode, setHasCode] = useState(false)
  const [codeValue, setCodeValue] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")

  const steps = [
    { id: 1, title: "Overzicht", description: "Controleer uw keuzes" },
    { id: 2, title: "Code", description: "Familie code (optioneel)" },
    { id: 3, title: "Betaling", description: "Betalingsgegevens" },
    { id: 4, title: "Bevestiging", description: "Alles geregeld" },
  ]

  const progress = (currentStep / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCodeSubmit = () => {
    if (codeValue.startsWith("DIRECTOR-")) {
      setHasCode(true)
      // In real app, validate code and update pricing
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">Uitvaart boeken</h1>
        <p className="text-lg text-slate-600">
          Laatste stap om alles te regelen voor {mockBookingData.funeral.deceased}
        </p>
      </div>

      {/* Progress */}
      <Card className="mb-6 border-purple-200 bg-purple-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Stap {currentStep} van {steps.length}: {steps[currentStep - 1].title}
            </h2>
            <span className="text-sm text-slate-500">{steps[currentStep - 1].description}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-8">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Heart className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Controleer uw keuzes</h3>
                    <p className="text-slate-600">Ziet alles er goed uit? Dan kunnen we doorgaan naar de boeking.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Service Details */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Uitvaartdetails
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">Type: {mockBookingData.funeral.type}</p>
                          <p className="text-slate-600">
                            Datum: {new Date(mockBookingData.funeral.serviceDate).toLocaleDateString("nl-NL")}
                          </p>
                          <p className="text-slate-600">Tijd: {mockBookingData.funeral.serviceTime}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Locatie: {mockBookingData.venue.name}</p>
                          <p className="text-slate-600">Adres: {mockBookingData.venue.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Director */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Uitvaartondernemer
                      </h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{mockBookingData.director.name}</p>
                          <p className="text-sm text-slate-600">{mockBookingData.director.company}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-sm text-slate-600">
                              ⭐ {mockBookingData.director.rating} ({mockBookingData.director.reviews} reviews)
                            </span>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Beschikbaar</Badge>
                      </div>
                    </div>

                    {/* Services */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-3">Gekozen diensten</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Uitvaartbegeleiding</span>
                          <span>€{mockBookingData.costs.directorFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Locatie huur</span>
                          <span>€{mockBookingData.costs.venueFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Catering</span>
                          <span>€{mockBookingData.costs.cateringFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Bloemen</span>
                          <span>€{mockBookingData.costs.flowersFee.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Heeft u een familie code?</h3>
                    <p className="text-slate-600">
                      Als uw uitvaartondernemer u een code heeft gegeven, kunt u deze hier invoeren voor gratis toegang.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="familyCode" className="text-base">
                        Familie code (optioneel)
                      </Label>
                      <div className="flex gap-3 mt-2">
                        <Input
                          id="familyCode"
                          value={codeValue}
                          onChange={(e) => setCodeValue(e.target.value)}
                          placeholder="DIRECTOR-ABC-1234"
                          className="flex-1"
                        />
                        <Button onClick={handleCodeSubmit} disabled={!codeValue}>
                          Controleren
                        </Button>
                      </div>
                    </div>

                    {hasCode && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-800">Code geaccepteerd!</span>
                        </div>
                        <p className="text-green-700 text-sm">
                          Uw uitvaartondernemer heeft deze code voor u aangemaakt. U hoeft geen platformkosten te
                          betalen.
                        </p>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Geen code? Geen probleem!</h4>
                      <p className="text-blue-700 text-sm">
                        U kunt gewoon doorgaan met de standaard platformkosten van €100. Dit dekt alle coördinatie en
                        ondersteuning.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <CreditCard className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Betalingsgegevens</h3>
                    <p className="text-slate-600">Veilig betalen via iDEAL of creditcard</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-base">Betalingsmethode</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <button
                          onClick={() => setPaymentMethod("ideal")}
                          className={`border rounded-lg p-4 text-center transition-colors ${
                            paymentMethod === "ideal"
                              ? "border-purple-500 bg-purple-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="font-medium">iDEAL</div>
                          <div className="text-sm text-slate-600">Nederlandse banken</div>
                        </button>
                        <button
                          onClick={() => setPaymentMethod("card")}
                          className={`border rounded-lg p-4 text-center transition-colors ${
                            paymentMethod === "card"
                              ? "border-purple-500 bg-purple-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="font-medium">Creditcard</div>
                          <div className="text-sm text-slate-600">Visa, Mastercard</div>
                        </button>
                      </div>
                    </div>

                    {paymentMethod === "ideal" && (
                      <div>
                        <Label htmlFor="bank" className="text-base">
                          Kies uw bank
                        </Label>
                        <select className="w-full mt-2 p-3 border border-slate-300 rounded-lg">
                          <option>Selecteer uw bank</option>
                          <option>ABN AMRO</option>
                          <option>ING</option>
                          <option>Rabobank</option>
                          <option>SNS Bank</option>
                          <option>ASN Bank</option>
                        </select>
                      </div>
                    )}

                    {paymentMethod === "card" && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cardNumber" className="text-base">
                            Kaartnummer
                          </Label>
                          <Input id="cardNumber" placeholder="1234 5678 9012 3456" className="mt-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry" className="text-base">
                              Vervaldatum
                            </Label>
                            <Input id="expiry" placeholder="MM/JJ" className="mt-2" />
                          </div>
                          <div>
                            <Label htmlFor="cvv" className="text-base">
                              CVV
                            </Label>
                            <Input id="cvv" placeholder="123" className="mt-2" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-slate-600" />
                        <span className="font-semibold text-slate-800">Veilig betalen</span>
                      </div>
                      <p className="text-slate-600 text-sm">
                        Uw betaalgegevens worden veilig verwerkt door onze gecertificeerde betalingspartner. Wij slaan
                        geen kaartgegevens op.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-slate-900 mb-2">Alles is geregeld</h3>
                    <p className="text-slate-600">
                      Uw uitvaart is geboekt. U ontvangt binnen enkele minuten een bevestiging per email.
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="font-semibold text-green-800 mb-4">Wat gebeurt er nu?</h4>
                    <div className="space-y-3 text-sm text-green-700">
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 rounded-full p-1 mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                        <span>Uw uitvaartondernemer wordt automatisch geïnformeerd</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 rounded-full p-1 mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                        <span>U krijgt binnen 2 uur contact voor de verdere planning</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 rounded-full p-1 mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                        <span>Alle documenten worden veilig opgeslagen in uw account</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 rounded-full p-1 mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                        <span>U ontvangt automatische herinneringen voor belangrijke stappen</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 bg-purple-700 hover:bg-purple-800">Naar uw dashboard</Button>
                    <Button variant="outline" className="flex-1">
                      Bevestiging downloaden
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Cost Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Kosten overzicht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Platform diensten</span>
                  <span>{hasCode ? "€0" : `€${mockBookingData.costs.platformFee}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Uitvaartbegeleiding</span>
                  <span>€{mockBookingData.costs.directorFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Locatie</span>
                  <span>€{mockBookingData.costs.venueFee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Catering</span>
                  <span>€{mockBookingData.costs.cateringFee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Bloemen</span>
                  <span>€{mockBookingData.costs.flowersFee}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-medium">
                  <span>Subtotaal</span>
                  <span>
                    €
                    {(hasCode
                      ? mockBookingData.costs.total - mockBookingData.costs.platformFee
                      : mockBookingData.costs.total
                    ).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-green-600">
                  <span>Verzekering</span>
                  <span>-€{mockBookingData.costs.insurance.toLocaleString()}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Te betalen</span>
                  <span>
                    €
                    {(hasCode
                      ? mockBookingData.costs.finalAmount - mockBookingData.costs.platformFee
                      : mockBookingData.costs.finalAmount
                    ).toLocaleString()}
                  </span>
                </div>

                {hasCode && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm font-medium">✓ Familie code toegepast</p>
                    <p className="text-green-700 text-xs">€{mockBookingData.costs.platformFee} bespaard</p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800 text-sm font-medium">Beschermd</span>
                  </div>
                  <p className="text-blue-700 text-xs">Geld-terug-garantie als u niet tevreden bent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Vorige
        </Button>

        {currentStep < steps.length ? (
          <Button
            onClick={handleNext}
            disabled={currentStep === 3 && !paymentMethod}
            className="bg-purple-700 hover:bg-purple-800 flex items-center gap-2"
          >
            {currentStep === 3 ? "Betalen" : "Volgende"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="bg-green-700 hover:bg-green-800">Naar dashboard</Button>
        )}
      </div>

      {/* Help Section */}
      <Card className="mt-6 border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-amber-800 text-sm">
                <strong>Hulp nodig?</strong> Ons team staat klaar om u te helpen. Bel 020-1234567 of chat met ons via
                WhatsApp.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
