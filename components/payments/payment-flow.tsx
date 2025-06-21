"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { CreditCard, Shield, CheckCircle, Euro, ArrowRight, ArrowLeft, Lock, Building } from "lucide-react"

const paymentMethods = [
  {
    id: "ideal",
    name: "iDEAL",
    description: "Direct betalen via uw bank",
    icon: <Building className="h-6 w-6" />,
    fee: "Gratis",
    processing: "Direct",
    popular: true,
  },
  {
    id: "card",
    name: "Creditcard",
    description: "Visa, Mastercard, American Express",
    icon: <CreditCard className="h-6 w-6" />,
    fee: "€2,50",
    processing: "Direct",
    popular: false,
  },
  {
    id: "bancontact",
    name: "Bancontact",
    description: "Belgische betaalkaarten",
    icon: <CreditCard className="h-6 w-6" />,
    fee: "€1,50",
    processing: "Direct",
    popular: false,
  },
  {
    id: "sofort",
    name: "SOFORT",
    description: "Direct bankieren",
    icon: <Building className="h-6 w-6" />,
    fee: "€1,00",
    processing: "Direct",
    popular: false,
  },
]

const paymentSteps = [
  { id: "method", title: "Betaalmethode", completed: false },
  { id: "details", title: "Gegevens", completed: false },
  { id: "confirm", title: "Bevestigen", completed: false },
  { id: "complete", title: "Voltooid", completed: false },
]

export function PaymentFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedMethod, setSelectedMethod] = useState("")
  const [paymentData, setPaymentData] = useState({
    amount: 850,
    description: "Platform diensten - Uitvaart Familie van der Berg",
    reference: "INV-2024-001",
  })

  const progress = ((currentStep + 1) / paymentSteps.length) * 100

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId)
  }

  const handleNext = () => {
    if (currentStep < paymentSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const selectedPaymentMethod = paymentMethods.find((method) => method.id === selectedMethod)

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Veilig Betalen</h1>
        <p className="text-slate-600">Uw betaling wordt veilig verwerkt</p>
      </div>

      {/* Progress */}
      <Card className="mb-8 border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Stap {currentStep + 1}: {paymentSteps[currentStep].title}
            </h2>
            <Badge className="bg-blue-100 text-blue-800">{Math.round(progress)}% voltooid</Badge>
          </div>
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {paymentSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`ml-2 text-sm ${index <= currentStep ? "text-slate-900" : "text-slate-500"}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-8">
              {/* Step 1: Payment Method */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Kies uw betaalmethode</h3>
                    <p className="text-slate-600 mb-6">Selecteer hoe u wilt betalen</p>
                  </div>

                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => handleMethodSelect(method.id)}
                        className={`w-full text-left border rounded-lg p-4 transition-colors ${
                          selectedMethod === method.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-slate-600">{method.icon}</div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-slate-900">{method.name}</h4>
                                {method.popular && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">Populair</Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">{method.description}</p>
                              <div className="flex gap-4 mt-2 text-xs text-slate-500">
                                <span>Kosten: {method.fee}</span>
                                <span>Verwerking: {method.processing}</span>
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 ${
                              selectedMethod === method.id ? "border-blue-500 bg-blue-500" : "border-slate-300"
                            }`}
                          >
                            {selectedMethod === method.id && <CheckCircle className="h-3 w-3 text-white m-0.5" />}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Payment Details */}
              {currentStep === 1 && selectedPaymentMethod && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Betaalgegevens</h3>
                    <p className="text-slate-600 mb-6">Voer uw gegevens in voor {selectedPaymentMethod.name}</p>
                  </div>

                  {selectedMethod === "ideal" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Selecteer uw bank</label>
                        <select className="w-full border border-slate-300 rounded-lg px-3 py-2">
                          <option value="">Kies uw bank</option>
                          <option value="ing">ING</option>
                          <option value="rabobank">Rabobank</option>
                          <option value="abn">ABN AMRO</option>
                          <option value="sns">SNS Bank</option>
                          <option value="asn">ASN Bank</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {selectedMethod === "card" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Kaartnummer</label>
                        <Input placeholder="1234 5678 9012 3456" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Vervaldatum</label>
                          <Input placeholder="MM/JJ" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">CVC</label>
                          <Input placeholder="123" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Naam op kaart</label>
                        <Input placeholder="Uw naam zoals op de kaart" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Confirmation */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Bevestig uw betaling</h3>
                    <p className="text-slate-600 mb-6">Controleer de gegevens voordat u betaalt</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Betaalmethode:</span>
                        <span className="font-medium">{selectedPaymentMethod?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Beschrijving:</span>
                        <span className="font-medium">{paymentData.description}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Referentie:</span>
                        <span className="font-medium">{paymentData.reference}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold">Totaal bedrag:</span>
                        <span className="font-bold text-green-600">€{paymentData.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Veilige betaling</h4>
                        <p className="text-sm text-blue-700">
                          Uw betaling wordt veilig verwerkt met SSL-encryptie. Uw gegevens worden niet opgeslagen.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Complete */}
              {currentStep === 3 && (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Betaling voltooid!</h3>
                    <p className="text-slate-600">Uw betaling is succesvol verwerkt</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-700">
                      U ontvangt binnen enkele minuten een bevestiging per e-mail
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Overzicht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Platform diensten</span>
                  <span>€100,00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Uitvaartbegeleiding</span>
                  <span>€750,00</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Totaal</span>
                  <span>€{paymentData.amount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Veiligheid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-green-700">
                <p>• SSL-versleuteling</p>
                <p>• PCI DSS gecertificeerd</p>
                <p>• Geen opslag van kaartgegevens</p>
                <p>• 24/7 fraudebewaking</p>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle>Hulp nodig?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-3">Heeft u vragen over uw betaling?</p>
              <Button className="w-full" variant="outline">
                Contact opnemen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Vorige
        </Button>

        {currentStep < 3 && (
          <Button
            onClick={handleNext}
            disabled={currentStep === 0 && !selectedMethod}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === 2 ? "Betalen" : "Volgende"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {currentStep === 3 && (
          <Button className="bg-green-600 hover:bg-green-700">
            Naar dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
