"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Building,
  Users,
  Euro,
  Calendar,
  Shield,
  CheckCircle,
  FileText,
  Smartphone,
  AlertCircle,
} from "lucide-react"
import { VenueHelpSupport } from "./venue-help-support"

interface VenueData {
  // Basic Info
  venueName: string
  venueType: string
  description: string
  address: string
  city: string
  postalCode: string
  phone: string
  email: string
  website: string

  // Capacity & Facilities
  maxCapacity: string
  minCapacity: string
  facilities: string[]
  accessibility: string[]
  parking: string
  publicTransport: string

  // Services & Pricing
  services: string[]
  basePrice: string
  pricingModel: string
  additionalServices: { name: string; price: string }[]

  // Availability
  operatingDays: string[]
  operatingHours: { start: string; end: string }
  blackoutDates: string[]
  advanceBooking: string

  // Religious/Cultural
  religiousAffiliation: string[]
  culturalServices: string[]
  restrictions: string

  // Legal & Insurance
  businessLicense: string
  insurance: string
  certifications: string[]

  // Contact Person
  contactName: string
  contactRole: string
  contactPhone: string
  contactEmail: string
}

const steps = [
  { id: "basic", title: "Basisgegevens", description: "Locatie informatie" },
  { id: "facilities", title: "Faciliteiten", description: "Capaciteit en voorzieningen" },
  { id: "services", title: "Diensten", description: "Services en prijzen" },
  { id: "availability", title: "Beschikbaarheid", description: "Openingstijden en planning" },
  { id: "cultural", title: "Cultureel", description: "Religieuze en culturele diensten" },
  { id: "legal", title: "Juridisch", description: "Vergunningen en verzekeringen" },
  { id: "contact", title: "Contactpersoon", description: "Primaire contactgegevens" },
  { id: "review", title: "Controle", description: "Gegevens controleren" },
]

const venueTypes = [
  "Crematorium",
  "Begraafplaats",
  "Kerk/Religieus gebouw",
  "Zalencentrum",
  "Uitvaartcentrum",
  "Gemeenschapshuis",
  "Hotel/Restaurant",
  "Anders",
]

const facilities = [
  "Airconditioning",
  "Geluidsinstallatie",
  "Livestream mogelijkheden",
  "Keuken/Catering",
  "Toiletvoorzieningen",
  "Kleedkamers",
  "Bloemen opstelling",
  "Muziek/Piano",
  "Projectie scherm",
  "WiFi",
]

const accessibilityOptions = [
  "Rolstoel toegankelijk",
  "Lift aanwezig",
  "Aangepaste toiletten",
  "Inductielus",
  "Braille bewegwijzering",
  "Assistentiehonden welkom",
]

export function VenueOnboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [venueData, setVenueData] = useState<VenueData>({
    venueName: "",
    venueType: "",
    description: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    email: "",
    website: "",
    maxCapacity: "",
    minCapacity: "",
    facilities: [],
    accessibility: [],
    parking: "",
    publicTransport: "",
    services: [],
    basePrice: "",
    pricingModel: "",
    additionalServices: [],
    operatingDays: [],
    operatingHours: { start: "", end: "" },
    blackoutDates: [],
    advanceBooking: "",
    religiousAffiliation: [],
    culturalServices: [],
    restrictions: "",
    businessLicense: "",
    insurance: "",
    certifications: [],
    contactName: "",
    contactRole: "",
    contactPhone: "",
    contactEmail: "",
  })

  const progress = ((currentStep + 1) / steps.length) * 100

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

  const handleInputChange = (field: keyof VenueData, value: any) => {
    setVenueData((prev) => ({ ...prev, [field]: value }))
  }

  const handleArrayToggle = (field: keyof VenueData, value: string) => {
    setVenueData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter((item) => item !== value)
        : [...(prev[field] as string[]), value],
    }))
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">Locatie Aanmelden</h1>
        <p className="text-lg text-slate-600">Sluit uw locatie aan bij het grootste uitvaartplatform van Nederland</p>
      </div>

      {/* Progress */}
      <Card className="mb-6 border-green-200 bg-green-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Stap {currentStep + 1} van {steps.length}: {steps[currentStep].title}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">{steps[currentStep].description}</span>
              <VenueHelpSupport context={currentStep === 3 ? "calendar" : currentStep === 2 ? "pricing" : "general"} />
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
                <Building className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Vertel ons over uw locatie</h3>
                <p className="text-slate-600">Basisinformatie over uw locatie en organisatie</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="venueName" className="text-base">
                    Naam van de locatie *
                  </Label>
                  <Input
                    id="venueName"
                    value={venueData.venueName}
                    onChange={(e) => handleInputChange("venueName", e.target.value)}
                    className="mt-2"
                    placeholder="Bijvoorbeeld: Westgaarde Crematorium"
                  />
                </div>

                <div>
                  <Label className="text-base">Type locatie *</Label>
                  <RadioGroup
                    value={venueData.venueType}
                    onValueChange={(value) => handleInputChange("venueType", value)}
                    className="mt-2"
                  >
                    {venueTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem value={type} id={type} />
                        <Label htmlFor={type}>{type}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-base">
                  Beschrijving *
                </Label>
                <Textarea
                  id="description"
                  value={venueData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="mt-2"
                  rows={4}
                  placeholder="Beschrijf uw locatie, sfeer en wat u bijzonder maakt..."
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address" className="text-base">
                    Adres *
                  </Label>
                  <Input
                    id="address"
                    value={venueData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="mt-2"
                    placeholder="Straat en huisnummer"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode" className="text-base">
                    Postcode *
                  </Label>
                  <Input
                    id="postalCode"
                    value={venueData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    className="mt-2"
                    placeholder="1234 AB"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-base">
                    Plaats *
                  </Label>
                  <Input
                    id="city"
                    value={venueData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="mt-2"
                    placeholder="Amsterdam"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base">
                    Telefoonnummer *
                  </Label>
                  <Input
                    id="phone"
                    value={venueData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="mt-2"
                    placeholder="020-1234567"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-base">
                    Email adres *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={venueData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="mt-2"
                    placeholder="info@locatie.nl"
                  />
                </div>
                <div>
                  <Label htmlFor="website" className="text-base">
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={venueData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    className="mt-2"
                    placeholder="www.locatie.nl"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Capaciteit en faciliteiten</h3>
                <p className="text-slate-600">Vertel ons over uw ruimte en voorzieningen</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="maxCapacity" className="text-base">
                    Maximum aantal gasten *
                  </Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    value={venueData.maxCapacity}
                    onChange={(e) => handleInputChange("maxCapacity", e.target.value)}
                    className="mt-2"
                    placeholder="150"
                  />
                </div>
                <div>
                  <Label htmlFor="minCapacity" className="text-base">
                    Minimum aantal gasten
                  </Label>
                  <Input
                    id="minCapacity"
                    type="number"
                    value={venueData.minCapacity}
                    onChange={(e) => handleInputChange("minCapacity", e.target.value)}
                    className="mt-2"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-base">Beschikbare faciliteiten *</Label>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  {facilities.map((facility) => (
                    <div key={facility} className="flex items-center space-x-2">
                      <Checkbox
                        id={facility}
                        checked={venueData.facilities.includes(facility)}
                        onCheckedChange={() => handleArrayToggle("facilities", facility)}
                      />
                      <Label htmlFor={facility}>{facility}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base">Toegankelijkheid</Label>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  {accessibilityOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={option}
                        checked={venueData.accessibility.includes(option)}
                        onCheckedChange={() => handleArrayToggle("accessibility", option)}
                      />
                      <Label htmlFor={option}>{option}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parking" className="text-base">
                    Parkeren
                  </Label>
                  <Textarea
                    id="parking"
                    value={venueData.parking}
                    onChange={(e) => handleInputChange("parking", e.target.value)}
                    className="mt-2"
                    rows={3}
                    placeholder="Beschrijf parkeermogelijkheden..."
                  />
                </div>
                <div>
                  <Label htmlFor="publicTransport" className="text-base">
                    Openbaar vervoer
                  </Label>
                  <Textarea
                    id="publicTransport"
                    value={venueData.publicTransport}
                    onChange={(e) => handleInputChange("publicTransport", e.target.value)}
                    className="mt-2"
                    rows={3}
                    placeholder="Bereikbaarheid met OV..."
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Euro className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Diensten en prijzen</h3>
                <p className="text-slate-600">Wat biedt u aan en wat zijn uw tarieven?</p>
              </div>

              <div>
                <Label htmlFor="basePrice" className="text-base">
                  Basis huurprijs per dag *
                </Label>
                <div className="flex items-center mt-2">
                  <span className="bg-slate-100 border border-r-0 border-slate-300 px-3 py-2 rounded-l-lg text-slate-600">
                    €
                  </span>
                  <Input
                    id="basePrice"
                    type="number"
                    value={venueData.basePrice}
                    onChange={(e) => handleInputChange("basePrice", e.target.value)}
                    className="rounded-l-none"
                    placeholder="450"
                  />
                </div>
                <p className="text-sm text-slate-500 mt-1">Exclusief BTW</p>
              </div>

              <div>
                <Label className="text-base">Prijsmodel</Label>
                <RadioGroup
                  value={venueData.pricingModel}
                  onValueChange={(value) => handleInputChange("pricingModel", value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed">Vaste prijs per dag</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hourly" id="hourly" />
                    <Label htmlFor="hourly">Prijs per uur</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="capacity" id="capacity" />
                    <Label htmlFor="capacity">Prijs op basis van aantal gasten</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom">Maatwerk prijzen</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base">Wat is inbegrepen in de basisprijs?</Label>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  {[
                    "Gebruik van de ruimte",
                    "Basis geluidsinstallatie",
                    "Stoelen en tafels",
                    "Schoonmaak",
                    "Verwarming/Airco",
                    "Parkeren",
                    "Technische ondersteuning",
                    "Catering faciliteiten",
                  ].map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={service}
                        checked={venueData.services.includes(service)}
                        onCheckedChange={() => handleArrayToggle("services", service)}
                      />
                      <Label htmlFor={service}>{service}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base">Extra diensten (optioneel)</Label>
                <p className="text-sm text-slate-500 mb-3">Diensten die u tegen meerprijs aanbiedt</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Naam van dienst" />
                    <div className="flex items-center">
                      <span className="bg-slate-100 border border-r-0 border-slate-300 px-3 py-2 rounded-l-lg text-slate-600">
                        €
                      </span>
                      <Input placeholder="Prijs" className="rounded-l-none" />
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    + Extra dienst toevoegen
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Agenda Integratie</h3>
                <p className="text-slate-600">Koppel uw agenda voor automatische beschikbaarheid</p>
              </div>

              {/* Quick Calendar Integration */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Card className="border-2 border-dashed border-blue-200 hover:border-blue-400 cursor-pointer transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2">Google Calendar</h4>
                    <p className="text-sm text-slate-600 mb-3">1-klik synchronisatie</p>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      🔗 Koppelen
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed border-orange-200 hover:border-orange-400 cursor-pointer transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="bg-orange-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2">Outlook</h4>
                    <p className="text-sm text-slate-600 mb-3">Automatische sync</p>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                      🔗 Koppelen
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed border-green-200 hover:border-green-400 cursor-pointer transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Smartphone className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2">WhatsApp Bot</h4>
                    <p className="text-sm text-slate-600 mb-3">Via WhatsApp beheren</p>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      🔗 Koppelen
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Help Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 rounded-full p-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-800 mb-2">Hulp nodig met agenda koppeling?</h4>
                    <p className="text-amber-700 text-sm mb-3">
                      Onze AI-assistent kan u stap-voor-stap helpen met het koppelen van uw agenda. De assistent kan
                      zelfs uw agenda-instellingen bekijken om u te helpen.
                    </p>
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                      🤖 AI Hulp Vragen
                    </Button>
                  </div>
                </div>
              </div>

              {/* Manual Setup Option */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-slate-900 mb-4">Of stel handmatig in:</h4>

                <div>
                  <Label className="text-base">Openingsdagen *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={venueData.operatingDays.includes(day)}
                          onCheckedChange={() => handleArrayToggle("operatingDays", day)}
                        />
                        <Label htmlFor={day}>{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="startTime" className="text-base">
                      Openingstijd
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={venueData.operatingHours.start}
                      onChange={(e) =>
                        handleInputChange("operatingHours", { ...venueData.operatingHours, start: e.target.value })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-base">
                      Sluitingstijd
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={venueData.operatingHours.end}
                      onChange={(e) =>
                        handleInputChange("operatingHours", { ...venueData.operatingHours, end: e.target.value })
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Shield className="h-8 w-8 text-teal-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Culturele en religieuze diensten</h3>
                <p className="text-slate-600">Welke tradities en gebruiken ondersteunt u?</p>
              </div>

              <div>
                <Label className="text-base">Religieuze affiliatie</Label>
                <p className="text-sm text-slate-500 mb-3">Selecteer alle tradities die u kunt accommoderen</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    "Christelijk (Protestant)",
                    "Christelijk (Katholiek)",
                    "Islamitisch",
                    "Joods",
                    "Hindoeïstisch",
                    "Boeddhistische",
                    "Humanistisch",
                    "Geen specifieke affiliatie",
                  ].map((religion) => (
                    <div key={religion} className="flex items-center space-x-2">
                      <Checkbox
                        id={religion}
                        checked={venueData.religiousAffiliation.includes(religion)}
                        onCheckedChange={() => handleArrayToggle("religiousAffiliation", religion)}
                      />
                      <Label htmlFor={religion}>{religion}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base">Culturele diensten</Label>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  {[
                    "Meertalige ceremonie",
                    "Traditionele muziek",
                    "Speciale catering",
                    "Culturele decoratie",
                    "Religieuze symbolen",
                    "Speciale rituelen ruimte",
                    "Wasvoorzieningen",
                    "Gebedsruimte",
                  ].map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={service}
                        checked={venueData.culturalServices.includes(service)}
                        onCheckedChange={() => handleArrayToggle("culturalServices", service)}
                      />
                      <Label htmlFor={service}>{service}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="restrictions" className="text-base">
                  Beperkingen of speciale vereisten
                </Label>
                <Textarea
                  id="restrictions"
                  value={venueData.restrictions}
                  onChange={(e) => handleInputChange("restrictions", e.target.value)}
                  className="mt-2"
                  rows={4}
                  placeholder="Bijvoorbeeld: geen alcohol, specifieke kledingvoorschriften, etc."
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 mb-2">Culturele expertise</h4>
                <p className="text-amber-700 text-sm">
                  Families zoeken vaak naar locaties die hun tradities begrijpen. Hoe meer u kunt accommoderen, hoe meer
                  boekingen u zult ontvangen van diverse gemeenschappen.
                </p>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <FileText className="h-8 w-8 text-red-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Juridische documenten</h3>
                <p className="text-slate-600">Upload uw vergunningen en verzekeringspapieren</p>
              </div>

              <div>
                <Label htmlFor="businessLicense" className="text-base">
                  KvK nummer *
                </Label>
                <Input
                  id="businessLicense"
                  value={venueData.businessLicense}
                  onChange={(e) => handleInputChange("businessLicense", e.target.value)}
                  className="mt-2"
                  placeholder="12345678"
                />
              </div>

              <div>
                <Label className="text-base">Verzekeringen *</Label>
                <div className="space-y-3 mt-3">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 mb-2">Aansprakelijkheidsverzekering</p>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Bestand uploaden
                    </Button>
                  </div>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 mb-2">Gebouwverzekering</p>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Bestand uploaden
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base">Certificeringen</Label>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  {[
                    "ARBO certificaat",
                    "Brandveiligheid",
                    "Hygiëne certificaat",
                    "Toegankelijkheid certificaat",
                    "Milieu certificaat",
                    "Kwaliteitskeurmerk",
                  ].map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox
                        id={cert}
                        checked={venueData.certifications.includes(cert)}
                        onCheckedChange={() => handleArrayToggle("certifications", cert)}
                      />
                      <Label htmlFor={cert}>{cert}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">Belangrijke informatie</h4>
                <p className="text-red-700 text-sm">
                  Alle documenten worden veilig opgeslagen en alleen gebruikt voor verificatie. Uw aanmelding wordt
                  binnen 2 werkdagen beoordeeld door ons team.
                </p>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Users className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Contactpersoon</h3>
                <p className="text-slate-600">Wie is het primaire aanspreekpunt voor boekingen?</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName" className="text-base">
                    Naam *
                  </Label>
                  <Input
                    id="contactName"
                    value={venueData.contactName}
                    onChange={(e) => handleInputChange("contactName", e.target.value)}
                    className="mt-2"
                    placeholder="Jan Janssen"
                  />
                </div>
                <div>
                  <Label htmlFor="contactRole" className="text-base">
                    Functie *
                  </Label>
                  <Input
                    id="contactRole"
                    value={venueData.contactRole}
                    onChange={(e) => handleInputChange("contactRole", e.target.value)}
                    className="mt-2"
                    placeholder="Manager, Eigenaar, etc."
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPhone" className="text-base">
                    Telefoonnummer *
                  </Label>
                  <Input
                    id="contactPhone"
                    value={venueData.contactPhone}
                    onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                    className="mt-2"
                    placeholder="06-12345678"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail" className="text-base">
                    Email adres *
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={venueData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    className="mt-2"
                    placeholder="contact@locatie.nl"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Communicatie voorkeuren</h4>
                <p className="text-blue-700 text-sm mb-3">Hoe wilt u boekingsaanvragen ontvangen?</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="email-notifications" defaultChecked />
                    <Label htmlFor="email-notifications">Email notificaties</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sms-notifications" />
                    <Label htmlFor="sms-notifications">SMS notificaties</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="whatsapp-notifications" />
                    <Label htmlFor="whatsapp-notifications">WhatsApp notificaties</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="phone-calls" />
                    <Label htmlFor="phone-calls">Telefonisch contact</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Controleer uw gegevens</h3>
                <p className="text-slate-600">Controleer alle informatie voordat u uw aanmelding verstuurt</p>
              </div>

              <div className="space-y-4">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Locatie informatie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Naam:</span>
                        <span className="ml-2 font-medium">{venueData.venueName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Type:</span>
                        <span className="ml-2 font-medium">{venueData.venueType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Adres:</span>
                        <span className="ml-2 font-medium">
                          {venueData.address}, {venueData.city}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Capaciteit:</span>
                        <span className="ml-2 font-medium">
                          {venueData.minCapacity}-{venueData.maxCapacity} personen
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Prijzen en diensten</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Basisprijs:</span>
                        <span className="ml-2 font-medium">€{venueData.basePrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Faciliteiten:</span>
                        <span className="ml-2 font-medium">{venueData.facilities.length} beschikbaar</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Contactgegevens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Contactpersoon:</span>
                        <span className="ml-2 font-medium">{venueData.contactName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Email:</span>
                        <span className="ml-2 font-medium">{venueData.contactEmail}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-800 mb-3">Wat gebeurt er nu?</h4>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Uw aanmelding wordt binnen 2 werkdagen beoordeeld</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>U ontvangt een bevestiging per email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Na goedkeuring krijgt u toegang tot het dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Uw eerste boeking is gratis (geen commissie)</span>
                  </div>
                </div>
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
          <Button className="bg-green-700 hover:bg-green-800 flex items-center gap-2">
            Aanmelding versturen
            <CheckCircle className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleNext} className="bg-green-700 hover:bg-green-800 flex items-center gap-2">
            Volgende
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
