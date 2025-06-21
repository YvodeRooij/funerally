"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Star, MapPin, Users, Calendar, Phone, Camera, Clock, Car, ArrowRight, Share } from "lucide-react"
import Link from "next/link"

interface VenueBrowsingInterfaceProps {
  userType: "family" | "director"
}

interface Venue {
  id: string
  name: string
  type: "crematorium" | "begraafplaats" | "uitvaartcentrum" | "kerk" | "bijzonder"
  location: {
    address: string
    city: string
    distance: number
    travelTime: number
  }
  capacity: {
    min: number
    max: number
  }
  pricing: {
    from: number
    familyPrice?: number
    directorPrice?: number
  }
  rating: number
  reviewCount: number
  images: string[]
  amenities: string[]
  specialties: string[]
  availability: {
    nextAvailable: string
    responseTime: string
  }
  isPopular?: boolean
  isFeatured?: boolean
  description: string
}

const mockVenues: Venue[] = [
  {
    id: "1",
    name: "Westgaarde Crematorium",
    type: "crematorium",
    location: {
      address: "Westgaarde 1, Amsterdam",
      city: "Amsterdam",
      distance: 3.2,
      travelTime: 12,
    },
    capacity: { min: 20, max: 200 },
    pricing: {
      from: 1650,
      familyPrice: 1850,
      directorPrice: 1650,
    },
    rating: 4.9,
    reviewCount: 127,
    images: [
      "/placeholder.svg?height=300&width=400&text=Moderne+Aula",
      "/placeholder.svg?height=300&width=400&text=Ontvangstruimte",
      "/placeholder.svg?height=300&width=400&text=Tuin+der+Herinnering",
    ],
    amenities: ["Parkeren", "Toegankelijk", "Geluidssysteem", "Wifi", "Koffie"],
    specialties: ["Multicultureel", "Muziek ceremonies", "Grote groepen"],
    availability: {
      nextAvailable: "Morgen beschikbaar",
      responseTime: "< 1 uur",
    },
    isPopular: true,
    isFeatured: true,
    description:
      "Een serene, moderne crematorium met prachtige tuinen en uitstekende faciliteiten voor ceremonies tot 200 gasten.",
  },
  {
    id: "2",
    name: "Begraafplaats Zorgvlied",
    type: "begraafplaats",
    location: {
      address: "Amstelveenseweg 273, Amsterdam",
      city: "Amsterdam",
      distance: 5.8,
      travelTime: 18,
    },
    capacity: { min: 10, max: 150 },
    pricing: {
      from: 950,
      familyPrice: 1100,
      directorPrice: 950,
    },
    rating: 4.7,
    reviewCount: 89,
    images: [
      "/placeholder.svg?height=300&width=400&text=Natuurlijke+Begraafplaats",
      "/placeholder.svg?height=300&width=400&text=Aula+Gebouw",
      "/placeholder.svg?height=300&width=400&text=Gedenkplaats",
    ],
    amenities: ["Parkeren", "Toegankelijk", "Natuurlijk", "Rustig"],
    specialties: ["Natuurbegrafenis", "Traditioneel", "Stille ceremonies"],
    availability: {
      nextAvailable: "Deze week",
      responseTime: "< 3 uur",
    },
    description: "Een prachtige, natuurlijke begraafplaats met eeuwenoude bomen en een vredige atmosfeer.",
  },
  {
    id: "3",
    name: "De Nieuwe Ooster",
    type: "uitvaartcentrum",
    location: {
      address: "Kruislaan 124, Amsterdam",
      city: "Amsterdam",
      distance: 7.1,
      travelTime: 22,
    },
    capacity: { min: 15, max: 300 },
    pricing: {
      from: 1950,
      familyPrice: 2200,
      directorPrice: 1950,
    },
    rating: 4.8,
    reviewCount: 203,
    images: [
      "/placeholder.svg?height=300&width=400&text=Grote+Ceremonie+Zaal",
      "/placeholder.svg?height=300&width=400&text=Ontvangst+Lobby",
      "/placeholder.svg?height=300&width=400&text=Catering+Ruimte",
    ],
    amenities: ["Parkeren", "Toegankelijk", "Catering", "Wifi", "Airco", "AV"],
    specialties: ["Grote ceremonies", "Catering service", "Technische ondersteuning"],
    availability: {
      nextAvailable: "Volgende week",
      responseTime: "< 30 min",
    },
    isFeatured: true,
    description:
      "Modern uitvaartcentrum met alle faciliteiten voor grote ceremonies en professionele catering service.",
  },
]

export function VenueBrowsingInterface({ userType }: VenueBrowsingInterfaceProps) {
  const [venues, setVenues] = useState<Venue[]>(mockVenues)
  const [favorites, setFavorites] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"relevance" | "price" | "rating" | "distance">("relevance")

  const toggleFavorite = (venueId: string) => {
    setFavorites((prev) => (prev.includes(venueId) ? prev.filter((id) => id !== venueId) : [...prev, venueId]))
  }

  const getPrice = (venue: Venue) => {
    if (userType === "director" && venue.pricing.directorPrice) {
      return venue.pricing.directorPrice
    }
    if (userType === "family" && venue.pricing.familyPrice) {
      return venue.pricing.familyPrice
    }
    return venue.pricing.from
  }

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
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "begraafplaats":
        return "bg-green-100 text-green-800 border-green-200"
      case "uitvaartcentrum":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "kerk":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{venues.length} locaties gevonden</h2>
          <p className="text-slate-600">In Amsterdam en omgeving</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Sorteer op:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="relevance">Relevantie</option>
            <option value="price">Prijs</option>
            <option value="rating">Beoordeling</option>
            <option value="distance">Afstand</option>
          </select>
        </div>
      </div>

      {/* Venue Grid */}
      <div className="grid gap-6">
        {venues.map((venue) => (
          <Card key={venue.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div className="md:flex">
              {/* Image Gallery */}
              <div className="md:w-80 relative">
                <div className="relative h-64 md:h-full">
                  <img
                    src={venue.images[0] || "/placeholder.svg"}
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {venue.isFeatured && <Badge className="bg-yellow-500 text-white border-0">⭐ Aanbevolen</Badge>}
                    {venue.isPopular && <Badge className="bg-red-500 text-white border-0">🔥 Populair</Badge>}
                  </div>

                  {/* Actions */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-10 h-10 p-0 bg-white/90 hover:bg-white"
                      onClick={() => toggleFavorite(venue.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          favorites.includes(venue.id) ? "fill-red-500 text-red-500" : "text-slate-600"
                        }`}
                      />
                    </Button>
                    <Button size="sm" variant="secondary" className="w-10 h-10 p-0 bg-white/90 hover:bg-white">
                      <Share className="h-4 w-4 text-slate-600" />
                    </Button>
                  </div>

                  {/* Image Counter */}
                  <div className="absolute bottom-3 right-3">
                    <Badge className="bg-black/70 text-white border-0">
                      <Camera className="h-3 w-3 mr-1" />
                      {venue.images.length}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Content */}
              <CardContent className="flex-1 p-6">
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getTypeColor(venue.type)}>
                          {getTypeIcon(venue.type)} {venue.type}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{venue.rating}</span>
                          <span className="text-sm text-slate-500">({venue.reviewCount})</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{venue.name}</h3>
                      <div className="flex items-center gap-1 text-slate-600 mb-2">
                        <MapPin className="h-4 w-4" />
                        <span>{venue.location.address}</span>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-slate-900">€{getPrice(venue).toLocaleString()}</div>
                      {userType === "director" &&
                        venue.pricing.directorPrice &&
                        venue.pricing.directorPrice < venue.pricing.familyPrice! && (
                          <div className="text-sm text-green-600 font-medium">Uw tarief</div>
                        )}
                      <div className="text-sm text-slate-500">vanaf</div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-700 mb-4 line-clamp-2">{venue.description}</p>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>
                        {venue.capacity.min}-{venue.capacity.max}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="h-4 w-4 text-slate-400" />
                      <span>{venue.location.travelTime} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-green-600">{venue.availability.nextAvailable}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{venue.availability.responseTime}</span>
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
                          +{venue.amenities.length - 4} meer
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-auto">
                    <Button asChild className="flex-1">
                      <Link href={`/venues/${venue.id}`}>
                        Bekijk Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={`tel:+31201234567`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Bellen
                      </a>
                    </Button>
                    {userType === "director" && (
                      <Button variant="outline" asChild>
                        <Link href={`/venues/${venue.id}/book`}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Boeken
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center py-8">
        <Button variant="outline" size="lg">
          Meer locaties laden
        </Button>
      </div>
    </div>
  )
}
