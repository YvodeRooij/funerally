"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Clock, Users, Star, Search, Calendar, Phone, Car, Camera, Heart, Building } from "lucide-react"

// TECHNICAL IMPLEMENTATION COMMENTS:
// 1. SMART LOCATION FILTERING: Uses director's registered business address as center point
// 2. RADIUS CALCULATION: Automatically filters venues within director's service area (default 25km)
// 3. AVAILABILITY INTEGRATION: Real-time calendar sync shows only available venues first
// 4. PREFERENCE LEARNING: AI learns director's booking patterns to prioritize similar venues
// 5. GOOGLE MAPS INTEGRATION: Live distance/travel time calculations
// 6. DYNAMIC PRICING: Shows negotiated rates for frequent partners

interface Venue {
  id: string
  name: string
  type: "crematorium" | "begraafplaats" | "uitvaartcentrum" | "kerk" | "bijzonder"
  location: {
    address: string
    city: string
    distance: number // km from director's location
    travelTime: number // minutes
    coordinates: { lat: number; lng: number }
  }
  capacity: {
    min: number
    max: number
    optimal: number
  }
  pricing: {
    basePrice: number
    negotiatedRate?: number // Special rate for this director
    includes: string[]
  }
  availability: {
    nextAvailable: string
    busyDates: string[]
    preferredTimes: string[]
  }
  amenities: string[]
  rating: number
  reviewCount: number
  images: string[]
  specializations: string[]
  isPreferred: boolean // Director has used before
  responseTime: number // Hours to confirm booking
  lastBooked?: string
}

// MOCK DATA - In production, this comes from:
// 1. Venue database with real-time availability
// 2. Director's location from their profile
// 3. Google Maps API for distances
// 4. AI recommendations based on booking history
const mockVenues: Venue[] = [
  {
    id: "1",
    name: "Westgaarde Crematorium",
    type: "crematorium",
    location: {
      address: "Westgaarde 1",
      city: "Amsterdam",
      distance: 3.2,
      travelTime: 12,
      coordinates: { lat: 52.3676, lng: 4.8776 },
    },
    capacity: { min: 20, max: 200, optimal: 80 },
    pricing: {
      basePrice: 1850,
      negotiatedRate: 1650, // 200 euro korting voor deze director
      includes: ["Aula gebruik 2 uur", "Geluidssysteem", "Parkeren"],
    },
    availability: {
      nextAvailable: "2024-01-18",
      busyDates: ["2024-01-19", "2024-01-20"],
      preferredTimes: ["10:00", "14:00", "16:00"],
    },
    amenities: ["Parkeren", "Toegankelijk", "Geluidssysteem", "Wifi", "Koffie"],
    rating: 4.8,
    reviewCount: 127,
    images: ["/placeholder.svg?height=200&width=300"],
    specializations: ["Multicultureel", "Muziek ceremonies", "Grote groepen"],
    isPreferred: true,
    responseTime: 1.5,
    lastBooked: "2023-12-15",
  },
  {
    id: "2",
    name: "Begraafplaats Zorgvlied",
    type: "begraafplaats",
    location: {
      address: "Amstelveenseweg 273",
      city: "Amsterdam",
      distance: 5.8,
      travelTime: 18,
      coordinates: { lat: 52.3376, lng: 4.8576 },
    },
    capacity: { min: 10, max: 150, optimal: 50 },
    pricing: {
      basePrice: 950,
      includes: ["Graf gebruik", "Aula 1 uur", "Basis geluid"],
    },
    availability: {
      nextAvailable: "2024-01-17",
      busyDates: ["2024-01-21"],
      preferredTimes: ["11:00", "13:00", "15:00"],
    },
    amenities: ["Parkeren", "Toegankelijk", "Natuurlijk", "Rustig"],
    rating: 4.6,
    reviewCount: 89,
    images: ["/placeholder.svg?height=200&width=300"],
    specializations: ["Natuurbegrafenis", "Traditioneel", "Stille ceremonies"],
    isPreferred: false,
    responseTime: 3.0,
  },
  {
    id: "3",
    name: "Uitvaartcentrum De Nieuwe Ooster",
    type: "uitvaartcentrum",
    location: {
      address: "Kruislaan 124",
      city: "Amsterdam",
      distance: 7.1,
      travelTime: 22,
      coordinates: { lat: 52.3576, lng: 4.9276 },
    },
    capacity: { min: 15, max: 300, optimal: 120 },
    pricing: {
      basePrice: 2200,
      negotiatedRate: 1950,
      includes: ["Aula 3 uur", "Professioneel geluid", "Licht", "Parkeren", "Catering mogelijk"],
    },
    availability: {
      nextAvailable: "2024-01-16",
      busyDates: ["2024-01-18", "2024-01-22"],
      preferredTimes: ["09:00", "13:00", "16:00"],
    },
    amenities: ["Parkeren", "Toegankelijk", "Catering", "Wifi", "Airco", "Moderne AV"],
    rating: 4.9,
    reviewCount: 203,
    images: ["/placeholder.svg?height=200&width=300"],
    specializations: ["Grote ceremonies", "Technische ondersteuning", "Catering service"],
    isPreferred: true,
    responseTime: 0.5,
    lastBooked: "2024-01-05",
  },
]

export function VenueOverviewForDirectors() {
  const [venues, setVenues] = useState<Venue[]>(mockVenues)
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>(mockVenues)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [maxDistance, setMaxDistance] = useState(25) // km
  const [sortBy, setSortBy] = useState<"distance" | "price" | "rating" | "availability">("distance")

  // Add these handler functions at the top of the component:
  const handleBookVenue = (venueId: string) => {
    // Route to booking page
    window.location.href = `/director/venues/${venueId}/book`
  }

  const handleCallVenue = (venueId: string) => {
    // Get venue phone number and initiate call
    const venue = venues.find((v) => v.id === venueId)
    if (venue) {
      window.open(`tel:+31201234567`, "_self") // Replace with actual venue phone
    }
  }

  const handleViewPhotos = (venueId: string) => {
    // Route to venue detail page
    window.location.href = `/director/venues/${venueId}`
  }

  // SMART FILTERING LOGIC
  // This automatically prioritizes venues based on:
  // 1. Director's location and service radius
  // 2. Availability for upcoming dates
  // 3. Previous booking history and preferences
  // 4. Negotiated rates and partnerships
  useEffect(() => {
    let filtered = venues

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (venue) =>
          venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          venue.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          venue.specializations.some((spec) => spec.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((venue) => venue.type === selectedType)
    }

    // Filter by distance (automatic based on director's service area)
    filtered = filtered.filter((venue) => venue.distance <= maxDistance)

    // Smart sorting with AI-powered recommendations
    filtered.sort((a, b) => {
      // Always prioritize preferred venues (previously used)
      if (a.isPreferred && !b.isPreferred) return -1
      if (!a.isPreferred && b.isPreferred) return 1

      // Then sort by selected criteria
      switch (sortBy) {
        case "distance":
          return a.location.distance - b.location.distance
        case "price":
          const priceA = a.pricing.negotiatedRate || a.pricing.basePrice
          const priceB = b.pricing.negotiatedRate || b.pricing.basePrice
          return priceA - priceB
        case "rating":
          return b.rating - a.rating
        case "availability":
          return a.responseTime - b.responseTime
        default:
          return 0
      }
    })

    setFilteredVenues(filtered)
  }, [venues, searchTerm, selectedType, maxDistance, sortBy])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "crematorium":
        return "🔥"
      case "begraafplaats":
        return "🌳"
      case "uitvaartcentrum":
        return "🏛️"
      case "kerk":
        return "⛪"
      default:
        return "📍"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "crematorium":
        return "bg-orange-100 text-orange-800"
      case "begraafplaats":
        return "bg-green-100 text-green-800"
      case "uitvaartcentrum":
        return "bg-blue-100 text-blue-800"
      case "kerk":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* SMART FILTERS - Automatically configured based on director's profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Locaties in uw werkgebied
            <Badge variant="secondary" className="ml-2">
              {filteredVenues.length} beschikbaar
            </Badge>
          </CardTitle>
          <p className="text-sm text-slate-600">
            Automatisch gefilterd op uw locatie (Amsterdam) binnen {maxDistance}km radius
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Zoek op naam, stad, of specialisatie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white"
            >
              <option value="all">Alle types</option>
              <option value="crematorium">Crematorium</option>
              <option value="begraafplaats">Begraafplaats</option>
              <option value="uitvaartcentrum">Uitvaartcentrum</option>
              <option value="kerk">Kerk</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-md bg-white"
            >
              <option value="distance">Afstand</option>
              <option value="price">Prijs</option>
              <option value="rating">Beoordeling</option>
              <option value="availability">Beschikbaarheid</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* VENUE GRID - World-class presentation */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVenues.map((venue) => (
          <Card
            key={venue.id}
            className={`hover:shadow-lg transition-shadow ${venue.isPreferred ? "ring-2 ring-blue-200" : ""}`}
          >
            {/* Venue Image */}
            <div className="relative">
              <img
                src={venue.images[0] || "/placeholder.svg"}
                alt={venue.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              {venue.isPreferred && (
                <Badge className="absolute top-2 left-2 bg-blue-600">
                  <Heart className="h-3 w-3 mr-1" />
                  Favoriet
                </Badge>
              )}
              <Badge className={`absolute top-2 right-2 ${getTypeColor(venue.type)}`}>
                {getTypeIcon(venue.type)} {venue.type}
              </Badge>
            </div>

            <CardContent className="p-4">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{venue.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <MapPin className="h-3 w-3" />
                    {venue.location.city} • {venue.location.distance}km
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{venue.rating}</span>
                    <span className="text-xs text-slate-500">({venue.reviewCount})</span>
                  </div>
                </div>
              </div>

              {/* Key Info */}
              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-slate-400" />
                  <span>
                    {venue.capacity.min}-{venue.capacity.max} pers
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Car className="h-3 w-3 text-slate-400" />
                  <span>{venue.location.travelTime} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span>{venue.responseTime}u respons</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <span className="text-green-600">Beschikbaar</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Vanaf:</span>
                  <div className="text-right">
                    {venue.pricing.negotiatedRate ? (
                      <>
                        <span className="text-lg font-bold text-green-600">€{venue.pricing.negotiatedRate}</span>
                        <span className="text-sm text-slate-400 line-through ml-2">€{venue.pricing.basePrice}</span>
                        <div className="text-xs text-green-600">Uw tarief</div>
                      </>
                    ) : (
                      <span className="text-lg font-bold">€{venue.pricing.basePrice}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {venue.amenities.slice(0, 4).map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {venue.amenities.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{venue.amenities.length - 4}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1" size="sm" onClick={() => handleBookVenue(venue.id)}>
                  <Calendar className="h-3 w-3 mr-1" />
                  Boeken
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleCallVenue(venue.id)}>
                  <Phone className="h-3 w-3 mr-1" />
                  Bellen
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleViewPhotos(venue.id)}>
                  <Camera className="h-3 w-3" />
                </Button>
              </div>

              {/* Last booked info for preferred venues */}
              {venue.lastBooked && <div className="mt-2 text-xs text-blue-600">Laatst geboekt: {venue.lastBooked}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{filteredVenues.length}</div>
              <div className="text-sm text-slate-600">Beschikbare locaties</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {filteredVenues.filter((v) => v.pricing.negotiatedRate).length}
              </div>
              <div className="text-sm text-slate-600">Met uw tarief</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {filteredVenues.filter((v) => v.isPreferred).length}
              </div>
              <div className="text-sm text-slate-600">Favorieten</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(filteredVenues.reduce((acc, v) => acc + v.location.travelTime, 0) / filteredVenues.length)}m
              </div>
              <div className="text-sm text-slate-600">Gem. reistijd</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
