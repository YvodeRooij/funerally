"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Users, MapPin, Euro, ArrowLeft, ArrowRight, Heart, FileText, Phone } from "lucide-react"

// This is the DIRECTOR booking flow - they book on behalf of families
interface FamilyData {
  familyId: string
  deceasedName: string
  contactPerson: string
  contactPhone: string
  contactEmail: string
  serviceType: string
  preferredDate: string
  preferredTime: string
  attendees: number
  budget: number
  specialRequests: string
  culturalRequirements: string[]
}

const mockFamilyData: FamilyData = {
  familyId: "FAM-2024-001",
  deceasedName: "Henk van der Berg",
  contactPerson: "Maria van der Berg",
  contactPhone: "06-12345678",
  contactEmail: "maria@email.com",
  serviceType: "Crematie",
  preferredDate: "2024-01-20",
  preferredTime: "14:00",
  attendees: 45,
  budget: 8500,
  specialRequests: "Witte rozen, klassieke muziek",
  culturalRequirements: ["Christelijke tradities"],
}

export function DirectorBookingFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedVenue, setSelectedVenue] = useState("")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [bookingNotes, setBookingNotes] = useState("")

  const steps = [
    { id: 1, title: "Familie overzicht", description: "Controleer familie wensen" },
    { id: 2, title: "Locatie kiezen", description: "Selecteer venue" },
    { id: 3, title: "Diensten", description: "Kies aanvullende diensten" },
    { id: 4, title: "Bevestiging", description: "Finaliseer boeking" },
  ]

  const progress = (currentStep / steps.length) * 100

  const availableVenues = [
    {
      id: "venue-1",
      name: "Westgaarde Crematorium",
      address: "Westgaardeweg 1, Amsterdam",
      capacity: 150,
      price: 450,
      available: true,
      timeSlots: ["13:00", "14:00", "15:00", "16:00"],
    },
    {
      id: "venue-2",
      name: "Begraafplaats Zorgvlied",
      address: "Kerkstraat 10, Amsterdam",
      capacity: 200,
      price: 350,
      available: true,
      timeSlots: ["14:00", "15:00"],
    },
  ]

  const additionalServices = [
    { id: "catering", name: "Catering na dienst", price: 25, unit: "per persoon" },
    { id: "flowers", name: "Bloemstukken", price: 150, unit: "per stuk" },
    { id: "music", name: "Muzikale begeleiding", price: 300, unit: "per dienst" },
    { id: "photography", name: "Fotografie", price: 200, unit: "per dienst" },
    { id: "livestream", name: "Live stream dienst", price: 100, unit: "per dienst" },
  ]

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

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  const calculateTotal = () => {
    const venue = availableVenues.find((v) => v.id === selectedVenue)
    const venuePrice = venue?.price || 0

    const servicesPrice = selectedServices.reduce((total, serviceId) => {
      const service = additionalServices.find((s) => s.id === serviceId)
      if (!service) return total

      if (service.unit === "per persoon") {
        return total + service.price * mockFamilyData.attendees
      }
      return total + service.price
    }, 0)

    return venuePrice + servicesPrice
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Heart className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-serif font-bold text-slate-900">Uitvaart Boeken</h1>
        </div>
        <p className="text-lg text-slate-600">Boek namens familie: {mockFamilyData.deceasedName}</p>
      </div>

      {/* Progress */}
      <Card className="mb-6 border-purple-200 bg-purple-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Stap {currentStep} van {steps.length}: {steps[currentStep - 1].title}
            </h2>
            <Badge className="bg-purple-100 text-purple-800">Familie ID: {mockFamilyData.familyId}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-8">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Familie Informatie</h3>
                    <p className="text-slate-600">Controleer de wensen van de familie</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Overledene</Label>
                        <p className="text-lg font-semibold text-slate-900">{mockFamilyData.deceasedName}</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700">Contactpersoon</Label>
                        <p className="text-slate-900">{mockFamilyData.contactPerson}</p>
                        <p className="text-sm text-slate-600">{mockFamilyData.contactPhone}</p>
                        <p className="text-sm text-slate-600">{mockFamilyData.contactEmail}</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700">Type uitvaart</Label>
                        <Badge className="bg-blue-100 text-blue-800">{mockFamilyData.serviceType}</Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Gewenste datum</Label>
                        <p className="text-slate-900">
                          {new Date(mockFamilyData.preferredDate).toLocaleDateString("nl-NL", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-slate-600">Tijd: {mockFamilyData.preferredTime}</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700">Verwachte gasten</Label>
                        <p className="text-slate-900">{mockFamilyData.attendees} personen</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700">Budget</Label>
                        <p className="text-slate-900">€{mockFamilyData.budget.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {mockFamilyData.specialRequests && (
                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium text-slate-700">Speciale wensen</Label>
                      <p className="text-slate-900 mt-1">{mockFamilyData.specialRequests}</p>
                    </div>
                  )}

                  {mockFamilyData.culturalRequirements.length > 0 && (
                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium text-slate-700">Culturele vereisten</Label>
                      <div className="flex gap-2 mt-2">
                        {mockFamilyData.culturalRequirements.map((req, index) => (
                          <Badge key={index} className="bg-green-100 text-green-800">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Contact familie</span>
                    </div>
                    <p className="text-blue-700 text-sm">
                      Laatste contact: Vandaag 10:30 - Familie is op de hoogte van de planning
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <MapPin className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Locatie Selecteren</h3>
                    <p className="text-slate-600">Kies de beste locatie voor de uitvaart</p>
                  </div>

                  <div className="space-y-4">
                    {availableVenues.map((venue) => (
                      <div
                        key={venue.id}
                        onClick={() => setSelectedVenue(venue.id)}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedVenue === venue.id
                            ? "border-green-500 bg-green-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{venue.name}</h4>
                            <p className="text-sm text-slate-600 mb-2">{venue.address}</p>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-slate-500">Capaciteit:</span>
                                <span className="ml-2 font-medium">{venue.capacity} personen</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Prijs:</span>
                                <span className="ml-2 font-medium">€{venue.price}</span>
                              </div>
                            </div>

                            <div className="mt-3">
                              <span className="text-slate-500 text-sm">Beschikbare tijden:</span>
                              <div className="flex gap-2 mt-1">
                                {venue.timeSlots.map((time) => (
                                  <Badge key={time} variant="outline" className="text-xs">
                                    {time}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="ml-4">
                            {venue.available ? (
                              <Badge className="bg-green-100 text-green-800">Beschikbaar</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">Bezet</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Aanvullende Diensten</h3>
                    <p className="text-slate-600">Selecteer gewenste extra diensten</p>
                  </div>

                  <div className="space-y-3">
                    {additionalServices.map((service) => (
                      <div
                        key={service.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedServices.includes(service.id)
                            ? "border-purple-500 bg-purple-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                        onClick={() => handleServiceToggle(service.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-900">{service.name}</h4>
                            <p className="text-sm text-slate-600">
                              €{service.price} {service.unit}
                              {service.unit === "per persoon" && ` (${mockFamilyData.attendees} gasten)`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-900">
                              €
                              {service.unit === "per persoon"
                                ? (service.price * mockFamilyData.attendees).toLocaleString()
                                : service.price.toLocaleString()}
                            </span>
                            {selectedServices.includes(service.id) && (
                              <CheckCircle className="h-5 w-5 text-purple-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <Label htmlFor="bookingNotes" className="text-base">
                      Aanvullende opmerkingen
                    </Label>
                    <Textarea
                      id="bookingNotes"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      className="mt-2"
                      placeholder="Speciale instructies voor de locatie of dienstverleners..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-slate-900 mb-2">Boeking Bevestigen</h3>
                    <p className="text-slate-600">Controleer alle details voordat u de boeking finaliseert</p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="font-semibold text-green-800 mb-4">Boeking Samenvatting</h4>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Familie:</span>
                        <span className="font-medium">{mockFamilyData.contactPerson}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Overledene:</span>
                        <span className="font-medium">{mockFamilyData.deceasedName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Datum & Tijd:</span>
                        <span className="font-medium">
                          {new Date(mockFamilyData.preferredDate).toLocaleDateString("nl-NL")} om{" "}
                          {mockFamilyData.preferredTime}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Locatie:</span>
                        <span className="font-medium">{availableVenues.find((v) => v.id === selectedVenue)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Gasten:</span>
                        <span className="font-medium">{mockFamilyData.attendees} personen</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 bg-green-700 hover:bg-green-800">Boeking Bevestigen</Button>
                    <Button variant="outline" className="flex-1">
                      Familie Informeren
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
                Kosten Overzicht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedVenue && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Locatie</span>
                    <span>€{availableVenues.find((v) => v.id === selectedVenue)?.price}</span>
                  </div>
                )}

                {selectedServices.map((serviceId) => {
                  const service = additionalServices.find((s) => s.id === serviceId)
                  if (!service) return null

                  const price =
                    service.unit === "per persoon" ? service.price * mockFamilyData.attendees : service.price

                  return (
                    <div key={serviceId} className="flex justify-between text-sm">
                      <span className="text-slate-600">{service.name}</span>
                      <span>€{price.toLocaleString()}</span>
                    </div>
                  )
                })}

                <Separator />

                <div className="flex justify-between font-medium">
                  <span>Totaal</span>
                  <span>€{calculateTotal().toLocaleString()}</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm font-medium">Familie Budget</p>
                  <p className="text-blue-700 text-xs">€{mockFamilyData.budget.toLocaleString()} beschikbaar</p>
                  {calculateTotal() > mockFamilyData.budget && (
                    <p className="text-red-700 text-xs mt-1">
                      ⚠️ Over budget: €{(calculateTotal() - mockFamilyData.budget).toLocaleString()}
                    </p>
                  )}
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

        <Button
          onClick={handleNext}
          disabled={currentStep === 2 && !selectedVenue}
          className="bg-purple-700 hover:bg-purple-800 flex items-center gap-2"
        >
          {currentStep === steps.length ? "Boeken" : "Volgende"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
