"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  Upload,
  CheckCircle,
  Users,
  TrendingUp,
  Target,
  Building,
  ArrowRight,
  Sparkles,
  Eye,
  Activity,
  MapIcon,
  MessageCircle,
  Clock,
  Phone,
} from "lucide-react"

/*
 * TECHNICAL IMPLEMENTATION NOTES:
 *
 * 1. GOOGLE MAPS API INTEGRATION:
 *    - This component will integrate with Google Maps JavaScript API
 *    - Required APIs: Maps JavaScript API, Geocoding API, Places API, Drawing Library
 *    - The mock SVG map will be replaced with: <GoogleMap center={userLocation} zoom={12}>
 *    - Real-time director pins will use MarkerClusterer for performance
 *    - Service area drawing will use google.maps.drawing.DrawingManager
 *    - Geocoding will convert addresses to lat/lng coordinates
 *
 * 2. GEMINI AI DOCUMENT EXTRACTION:
 *    - File upload will be processed by Gemini Vision API
 *    - Gemini will extract: company name, KvK number, address, phone, email, years active
 *    - OCR + structured data extraction from KvK uittreksel PDFs
 *    - Confidence scoring for each extracted field
 *    - Fallback to manual input if extraction confidence < 80%
 *
 * 3. REAL-TIME FEATURES:
 *    - WebSocket connection for live director status updates
 *    - Real-time family request notifications
 *    - Live market intelligence updates
 *
 * 4. DATABASE INTEGRATION:
 *    - PostGIS for spatial queries (finding nearby directors)
 *    - Real-time director availability status
 *    - Market intelligence data from CBS (Dutch statistics)
 */

interface DirectorLocation {
  lat: number
  lng: number
  address: string
  city: string
  postalCode: string
}

interface ServiceArea {
  type: "radius"
  radius: number
  center: DirectorLocation
}

interface MarketStats {
  gemeente: string
  directorsInArea: number
  potentialFunerals: number
  averageResponseTime: number
  marketSaturation: number
  averagePrice: number
  yourOpportunity: string
  competitionLevel: "low" | "medium" | "high"
}

interface NearbyDirector {
  id: string
  name: string
  location: DirectorLocation
  specializations: string[]
  yearsActive: number
  status: "active" | "busy" | "unavailable"
  responseTime: number
  completedFunerals: number
}

interface ExtractedData {
  companyName?: string
  kvkNumber?: string
  address?: string
  city?: string
  postalCode?: string
  phone?: string
  email?: string
  website?: string
  yearsActive?: number
}

// Real Netherlands locations for funeral directors
// TODO: Replace with actual database queries using PostGIS spatial functions
const netherlandsDirectors: NearbyDirector[] = [
  {
    id: "1",
    name: "Uitvaartondernemer A", // Anonymized
    location: { lat: 52.3676, lng: 4.9041, address: "Amsterdam Noord", city: "Amsterdam", postalCode: "1012 **" },
    specializations: ["Begrafenis", "Crematie"],
    yearsActive: 15,
    status: "active",
    responseTime: 1.2,
    completedFunerals: 0, // Hidden for privacy
  },
  {
    id: "2",
    name: "Uitvaartondernemer B", // Anonymized
    location: { lat: 52.0907, lng: 4.2663, address: "Rotterdam Centrum", city: "Rotterdam", postalCode: "3012 **" },
    specializations: ["Natuurbegrafenis", "Uitvaart thuis"],
    yearsActive: 8,
    status: "busy",
    responseTime: 2.8,
    completedFunerals: 0, // Hidden for privacy
  },
  {
    id: "3",
    name: "Uitvaartondernemer C", // Anonymized
    location: { lat: 52.0907, lng: 5.1214, address: "Utrecht Oost", city: "Utrecht", postalCode: "3511 **" },
    specializations: ["Multicultureel", "Islamitisch", "Joods"],
    yearsActive: 22,
    status: "active",
    responseTime: 1.8,
    completedFunerals: 0, // Hidden for privacy
  },
  {
    id: "4",
    name: "Uitvaartondernemer D", // Anonymized
    location: { lat: 52.3874, lng: 4.6462, address: "Haarlem Zuid", city: "Haarlem", postalCode: "2011 **" },
    specializations: ["Persoonlijke uitvaart", "Creatieve ceremonies"],
    yearsActive: 5,
    status: "active",
    responseTime: 2.1,
    completedFunerals: 0, // Hidden for privacy
  },
  {
    id: "5",
    name: "Uitvaartondernemer E", // Anonymized
    location: { lat: 52.0705, lng: 4.3007, address: "Den Haag West", city: "Den Haag", postalCode: "2514 **" },
    specializations: ["Staatsbegrafenis", "Diplomatiek"],
    yearsActive: 30,
    status: "active",
    responseTime: 1.5,
    completedFunerals: 0, // Hidden for privacy
  },
  {
    id: "6",
    name: "Uitvaartondernemer F", // Anonymized
    location: { lat: 51.4416, lng: 5.4697, address: "Eindhoven Centrum", city: "Eindhoven", postalCode: "5611 **" },
    specializations: ["Moderne uitvaart", "Tech-ceremonie"],
    yearsActive: 3,
    status: "busy",
    responseTime: 3.2,
    completedFunerals: 0, // Hidden for privacy
  },
  {
    id: "7",
    name: "Uitvaartondernemer G", // Anonymized
    location: { lat: 53.2194, lng: 6.5665, address: "Groningen Binnenstad", city: "Groningen", postalCode: "9712 **" },
    specializations: ["Noordelijke tradities", "Friestalig"],
    yearsActive: 18,
    status: "active",
    responseTime: 2.0,
    completedFunerals: 0, // Hidden for privacy
  },
]

export function DirectorOnboardingWithMap() {
  const [currentStep, setCurrentStep] = useState<"welcome" | "upload" | "processing" | "verified" | "area" | "live">(
    "welcome",
  )
  const [extractedData, setExtractedData] = useState<ExtractedData>({})
  const [userLocation, setUserLocation] = useState<DirectorLocation | null>(null)
  const [serviceArea, setServiceArea] = useState<ServiceArea | null>(null)
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null)
  const [nearbyDirectors, setNearbyDirectors] = useState<NearbyDirector[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationStep, setConversationStep] = useState(0)

  // TODO: Replace with actual Gemini AI document processing
  const processDocument = async (file: File) => {
    setCurrentStep("processing")
    setIsProcessing(true)

    /*
     * GEMINI AI INTEGRATION:
     *
     * const formData = new FormData();
     * formData.append('file', file);
     *
     * const response = await fetch('/api/extract-kvk', {
     *   method: 'POST',
     *   body: formData
     * });
     *
     * const extractedData = await response.json();
     *
     * Gemini will process the KvK document and extract:
     * - Bedrijfsnaam (Company name)
     * - KvK nummer (Chamber of Commerce number)
     * - Vestigingsadres (Business address)
     * - Postcode en plaats (Postal code and city)
     * - Telefoon en email (if available)
     * - Oprichtingsdatum (founding date to calculate years active)
     */

    // Simulate AI extraction with realistic Dutch data
    await new Promise((resolve) => setTimeout(resolve, 2500))

    const mockData: ExtractedData = {
      companyName: "Uitvaartzorg Van der Berg B.V.",
      kvkNumber: "34567890",
      address: "Hoofdstraat 156",
      city: "Amersfoort",
      postalCode: "3811 EP",
      phone: "033-4567890",
      email: "info@vandenberg-uitvaart.nl",
      website: "www.vandenberg-uitvaart.nl",
      yearsActive: 15,
    }

    setExtractedData(mockData)

    // TODO: Replace with Google Geocoding API
    /*
     * GOOGLE GEOCODING INTEGRATION:
     *
     * const geocoder = new google.maps.Geocoder();
     * const address = `${mockData.address}, ${mockData.postalCode} ${mockData.city}, Netherlands`;
     *
     * geocoder.geocode({ address }, (results, status) => {
     *   if (status === 'OK' && results[0]) {
     *     const location = results[0].geometry.location;
     *     setUserLocation({
     *       lat: location.lat(),
     *       lng: location.lng(),
     *       address: mockData.address,
     *       city: mockData.city,
     *       postalCode: mockData.postalCode
     *     });
     *   }
     * });
     */

    // Realistic Dutch location (Amersfoort - center of Netherlands)
    const mockLocation: DirectorLocation = {
      lat: 52.1561,
      lng: 5.3878,
      address: "Hoofdstraat 156",
      city: "Amersfoort",
      postalCode: "3811 EP",
    }

    setUserLocation(mockLocation)
    setNearbyDirectors(netherlandsDirectors)

    // Load market intelligence for Amersfoort area
    await loadMarketIntelligence(mockLocation)

    setIsProcessing(false)
    setCurrentStep("verified")
  }

  // TODO: Replace with real market intelligence API (CBS data + our platform data)
  const loadMarketIntelligence = async (location: DirectorLocation) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    /*
     * MARKET INTELLIGENCE DATA SOURCES:
     *
     * 1. CBS (Statistics Netherlands) - Death statistics by gemeente
     * 2. Our platform database - Active directors and their performance
     * 3. Real-time family requests from our system
     * 4. Pricing data from completed transactions
     */

    const mockStats: MarketStats = {
      gemeente: "Amersfoort",
      directorsInArea: 12,
      potentialFunerals: 680,
      averageResponseTime: 2.2,
      marketSaturation: 0.58,
      averagePrice: 4200,
      yourOpportunity: "Hoge vraag naar persoonlijke uitvaarten",
      competitionLevel: "medium",
    }

    setMarketStats(mockStats)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCurrentStep("upload")
      processDocument(file)
    }
  }

  const selectRadius = (radius: number) => {
    if (userLocation) {
      setServiceArea({
        type: "radius",
        radius,
        center: userLocation,
      })
      setCurrentStep("live")
    }
  }

  // Conversation flow for natural interaction
  const conversationSteps = [
    "Hallo! Ik ga u helpen met de aanmelding. Heeft u uw KvK uittreksel bij de hand?",
    "Perfect! Upload het document en ik lees automatisch uw bedrijfsgegevens uit.",
    "Geweldig! Ik zie dat u al {yearsActive} jaar actief bent. Laten we uw werkgebied instellen.",
    "Bijna klaar! Kies uw service radius en u bent live.",
  ]

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left Panel: Natural Conversation Flow */}
      <div className="w-2/5 overflow-y-auto border-r border-slate-200 bg-white">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-slate-900">Slimme Aanmelding</h1>
                <p className="text-slate-600">Uw persoonlijke assistent</p>
              </div>
            </div>
          </div>

          {/* Conversation Interface */}
          <div className="space-y-6">
            {/* Welcome Step */}
            {currentStep === "welcome" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-800 leading-relaxed">
                        Hallo! Ik ga u helpen met de aanmelding. Het duurt slechts 2 minuten en u ziet direct uw
                        marktpositie op de kaart.
                      </p>
                      <p className="text-slate-700 mt-2 font-medium">Heeft u uw KvK uittreksel bij de hand?</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setCurrentStep("upload")}
                    className="bg-blue-600 hover:bg-blue-700 flex-1"
                    size="lg"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Ja, ik heb het klaar
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-slate-500">
                    Geen KvK bij de hand?{" "}
                    <Link href="/providers/onboarding/manual" className="text-blue-600 hover:underline">
                      Handmatig invullen
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* Upload Step */}
            {currentStep === "upload" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-800 leading-relaxed">
                        Perfect! Upload uw KvK uittreksel en ik lees automatisch al uw bedrijfsgegevens uit. U
                        verschijnt direct op de kaart.
                      </p>
                    </div>
                  </div>
                </div>

                <Card className="border-2 border-dashed border-blue-300 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
                  <CardContent className="p-8 text-center">
                    <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Sleep uw KvK document hier</h3>
                    <p className="text-slate-600 mb-4">Of klik om een bestand te selecteren</p>

                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,image/*"
                      className="hidden"
                      id="kvk-upload"
                    />
                    <label htmlFor="kvk-upload">
                      <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer" size="lg" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Document Selecteren
                        </span>
                      </Button>
                    </label>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Processing Step */}
            {currentStep === "processing" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    </div>
                    <div>
                      <p className="text-slate-800 leading-relaxed font-medium">Bezig met verwerken...</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Document geüpload</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                          <span>Gemini AI leest bedrijfsgegevens...</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-50">
                          <Clock className="h-4 w-4" />
                          <span>Google Maps bepaalt locatie...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-100 rounded-lg p-4">
                  <Progress value={65} className="h-2" />
                  <p className="text-sm text-slate-600 mt-2 text-center">Nog even geduld...</p>
                </div>
              </div>
            )}

            {/* Verified Step */}
            {currentStep === "verified" && (
              <div className="space-y-6">
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-800 leading-relaxed">
                        Geweldig! Ik zie dat <strong>{extractedData.companyName}</strong> al {extractedData.yearsActive}{" "}
                        jaar actief is in {extractedData.city}. U staat nu op de kaart!
                      </p>
                      <p className="text-slate-700 mt-2">Laten we uw werkgebied instellen.</p>
                    </div>
                  </div>
                </div>

                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">Bedrijf:</span>
                        <p className="text-green-700">{extractedData.companyName}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">KvK:</span>
                        <p className="text-green-700">{extractedData.kvkNumber}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Locatie:</span>
                        <p className="text-green-700">{extractedData.city}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Actief:</span>
                        <p className="text-green-700">{extractedData.yearsActive} jaar</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={() => setCurrentStep("area")}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  Werkgebied Instellen
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Area Selection Step */}
            {currentStep === "area" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-800 leading-relaxed">
                        Welke radius wilt u bedienen? Ik zie dat de meeste uitvaartondernemers in uw gebied een radius
                        van 25-35km hanteren.
                      </p>
                    </div>
                  </div>
                </div>

                {marketStats && (
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-amber-600" />
                        <span className="font-semibold text-amber-800">Markt Inzicht</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-600">Uitvaarten/jaar:</span>
                          <p className="font-semibold text-slate-900">{marketStats.potentialFunerals}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Concurrenten:</span>
                          <p className="font-semibold text-slate-900">{marketStats.directorsInArea}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Uw kans:</span>
                          <p className="font-semibold text-green-700">
                            ~{Math.round(marketStats.potentialFunerals / marketStats.directorsInArea)}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-600">Gem. prijs:</span>
                          <p className="font-semibold text-slate-900">€{marketStats.averagePrice}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  <p className="font-medium text-slate-900">Kies uw service radius:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { radius: 20, label: "20km", desc: "Lokaal" },
                      { radius: 30, label: "30km", desc: "Regionaal", recommended: true },
                      { radius: 40, label: "40km", desc: "Uitgebreid" },
                      { radius: 50, label: "50km", desc: "Provinciaal" },
                    ].map(({ radius, label, desc, recommended }) => (
                      <Button
                        key={radius}
                        variant={recommended ? "default" : "outline"}
                        className={`h-auto p-4 flex flex-col items-center gap-1 ${
                          recommended ? "bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-300" : ""
                        }`}
                        onClick={() => selectRadius(radius)}
                      >
                        <span className="font-semibold">{label}</span>
                        <span className="text-xs opacity-80">{desc}</span>
                        {recommended && <Badge className="bg-blue-800 text-xs">Aanbevolen</Badge>}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Live Step */}
            {currentStep === "live" && (
              <div className="space-y-6">
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-800 leading-relaxed font-medium">
                        Gefeliciteerd! U bent nu live en zichtbaar voor families in uw gebied.
                      </p>
                      <p className="text-slate-700 mt-2">
                        Ik zie al {Math.floor(Math.random() * 3) + 1} families die hulp zoeken in uw werkgebied.
                      </p>
                    </div>
                  </div>
                </div>

                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-green-800">Uw Werkgebied</h3>
                      <Badge className="bg-green-100 text-green-800">{serviceArea?.radius}km radius</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm text-center">
                      <div className="p-2 bg-white rounded">
                        <p className="font-semibold text-slate-900">
                          {marketStats ? Math.round(marketStats.potentialFunerals / marketStats.directorsInArea) : 0}
                        </p>
                        <p className="text-slate-600 text-xs">Uitvaarten/jaar</p>
                      </div>
                      <div className="p-2 bg-white rounded">
                        <p className="font-semibold text-slate-900">€{marketStats?.averagePrice || 0}</p>
                        <p className="text-slate-600 text-xs">Gem. waarde</p>
                      </div>
                      <div className="p-2 bg-white rounded">
                        <p className="font-semibold text-slate-900">{marketStats?.directorsInArea || 0}</p>
                        <p className="text-slate-600 text-xs">Concurrenten</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Link href="/dashboard" className="flex-1">
                    <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                      <Phone className="h-4 w-4 mr-2" />
                      Naar Dashboard
                    </Button>
                  </Link>
                  <Link href="/providers/profile">
                    <Button variant="outline" size="lg">
                      Profiel Aanvullen
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Netherlands Map */}
      <div className="w-3/5 relative bg-slate-100">
        {!userLocation ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MapIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Nederland Kaart</h3>
              <p className="text-slate-500">Upload uw KvK om uw locatie te zien</p>
            </div>
          </div>
        ) : (
          <>
            {/*
             * TODO: Replace this SVG with Google Maps component:
             *
             * <GoogleMap
             *   center={{ lat: 52.1326, lng: 5.2913 }} // Center of Netherlands
             *   zoom={7}
             *   mapContainerStyle={{ width: '100%', height: '100%' }}
             * >
             *   <Marker position={userLocation} icon={customIcon} />
             *   {nearbyDirectors.map(director => (
             *     <Marker key={director.id} position={director.location} />
             *   ))}
             *   {serviceArea && (
             *     <Circle
             *       center={serviceArea.center}
             *       radius={serviceArea.radius * 1000} // Convert km to meters
             *       options={{
             *         strokeColor: '#2563eb',
             *         strokeOpacity: 0.8,
             *         strokeWeight: 2,
             *         fillColor: '#3b82f6',
             *         fillOpacity: 0.1,
             *       }}
             *     />
             *   )}
             * </GoogleMap>
             */}

            {/* Netherlands Map Visualization */}
            <div className="h-full bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden">
              {/* Netherlands Outline */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 400 600"
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
              >
                {/* Simplified Netherlands shape */}
                <path
                  d="M100 100 L300 80 L320 150 L310 250 L290 350 L280 450 L250 500 L200 520 L150 500 L120 450 L110 350 L90 250 L95 150 Z"
                  fill="rgba(34, 197, 94, 0.1)"
                  stroke="rgba(34, 197, 94, 0.3)"
                  strokeWidth="2"
                />

                {/* Major cities */}
                <circle cx="200" cy="180" r="3" fill="#1f2937" />
                <text x="205" y="185" fontSize="10" fill="#1f2937">
                  Amsterdam
                </text>

                <circle cx="180" cy="220" r="3" fill="#1f2937" />
                <text x="185" y="225" fontSize="10" fill="#1f2937">
                  Den Haag
                </text>

                <circle cx="160" cy="280" r="3" fill="#1f2937" />
                <text x="165" y="285" fontSize="10" fill="#1f2937">
                  Rotterdam
                </text>

                <circle cx="220" cy="240" r="3" fill="#1f2937" />
                <text x="225" y="245" fontSize="10" fill="#1f2937">
                  Utrecht
                </text>

                <circle cx="210" cy="200" r="3" fill="#2563eb" />
                <text x="215" y="205" fontSize="10" fill="#2563eb" fontWeight="bold">
                  Amersfoort
                </text>
              </svg>

              {/* Your Location (Amersfoort) */}
              <div className="absolute" style={{ top: "33%", left: "52%" }}>
                <div className="relative">
                  <div className="animate-ping absolute h-6 w-6 rounded-full bg-blue-400 opacity-75"></div>
                  <div className="relative h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <Building className="h-3 w-3 text-white" />
                  </div>
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg border text-xs whitespace-nowrap">
                    <p className="font-semibold text-slate-900">{extractedData.companyName}</p>
                    <p className="text-slate-600">{extractedData.city}</p>
                  </div>
                </div>
              </div>

              {/* Service Area Circle */}
              {serviceArea && (
                <div
                  className="absolute border-2 border-blue-500 border-dashed rounded-full bg-blue-200 bg-opacity-20"
                  style={{
                    width: `${serviceArea.radius * 3}px`,
                    height: `${serviceArea.radius * 3}px`,
                    top: "33%",
                    left: "52%",
                    transform: "translate(-50%, -50%)",
                  }}
                ></div>
              )}

              {/* Other Directors */}
              {nearbyDirectors.slice(0, 5).map((director, index) => {
                const positions = [
                  { top: "30%", left: "50%" }, // Amsterdam
                  { top: "47%", left: "40%" }, // Rotterdam
                  { top: "40%", left: "55%" }, // Utrecht
                  { top: "32%", left: "46%" }, // Haarlem
                  { top: "37%", left: "45%" }, // Den Haag
                ]

                return (
                  <div key={director.id} className="absolute" style={positions[index]}>
                    <div className="relative group">
                      <div
                        className={`h-4 w-4 rounded-full flex items-center justify-center ${
                          director.status === "active"
                            ? "bg-green-500"
                            : director.status === "busy"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                        }`}
                      >
                        <Users className="h-2 w-2 text-white" />
                      </div>
                      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs z-10">
                        <p className="font-semibold">Collega uitvaartondernemer</p>
                        <p className="text-slate-600">{director.location.city} gebied</p>
                        <p className="text-slate-500">{director.yearsActive}+ jaar ervaring</p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Live Family Requests */}
              <div className="absolute top-40 right-32">
                <div className="bg-red-100 border-2 border-red-300 rounded-full p-1 animate-pulse">
                  <Eye className="h-3 w-3 text-red-600" />
                </div>
              </div>
              <div className="absolute bottom-40 left-32">
                <div className="bg-red-100 border-2 border-red-300 rounded-full p-1 animate-pulse">
                  <Eye className="h-3 w-3 text-red-600" />
                </div>
              </div>
            </div>

            {/* Map Overlay Stats */}
            <div className="absolute top-4 left-4 space-y-2">
              <Card className="bg-white/95 backdrop-blur">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-sm">Markt {marketStats?.gemeente}</span>
                  </div>
                  {marketStats && (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Uitvaartondernemers:</span>
                        <span className="font-medium">{marketStats.directorsInArea}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uitvaarten/jaar:</span>
                        <span className="font-medium">{marketStats.potentialFunerals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uw potentieel:</span>
                        <span className="font-medium text-green-600">
                          ~{Math.round(marketStats.potentialFunerals / marketStats.directorsInArea)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gem. responstijd:</span>
                        <span className="font-medium">{marketStats.averageResponseTime}u</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {marketStats && (
                <Card className="bg-green-50/95 backdrop-blur border-green-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-sm text-green-800">Uw Kans</span>
                    </div>
                    <p className="text-xs text-green-700">{marketStats.yourOpportunity}</p>
                    <div className="mt-2 flex items-center gap-1">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          marketStats.competitionLevel === "low"
                            ? "bg-green-500"
                            : marketStats.competitionLevel === "medium"
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                      ></div>
                      <span className="text-xs capitalize">{marketStats.competitionLevel} concurrentie</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Live Activity Indicator */}
            <div className="absolute top-4 right-4">
              <Card className="bg-red-50/95 backdrop-blur border-red-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-sm text-red-800">Live Activiteit</span>
                  </div>
                  <p className="text-xs text-red-700">{Math.floor(Math.random() * 3) + 1} families zoeken hulp</p>
                  {currentStep !== "live" && (
                    <Button size="sm" className="mt-2 bg-red-600 hover:bg-red-700 text-xs h-6">
                      Voltooi aanmelding
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4">
              <Card className="bg-white/95 backdrop-blur">
                <CardContent className="p-3">
                  <h4 className="font-semibold text-sm mb-2">Legenda</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-blue-600 rounded-full"></div>
                      <span>Uw locatie</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                      <span>Actieve collega's</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-amber-500 rounded-full"></div>
                      <span>Bezette collega's</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-red-400 rounded-full animate-pulse"></div>
                      <span>Families zoeken hulp</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
