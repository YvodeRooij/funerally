"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin,
  Users,
  Star,
  Calendar,
  Phone,
  Mail,
  Car,
  Wifi,
  Coffee,
  Accessibility,
  Camera,
  Heart,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function VenueDetailPage() {
  const params = useParams()
  const venueId = params.id

  // Mock venue data - in production, fetch based on venueId
  const venue = {
    id: venueId,
    name: "Westgaarde Crematorium",
    type: "crematorium",
    location: {
      address: "Westgaarde 1, 1017 ZZ Amsterdam",
      city: "Amsterdam",
      distance: 3.2,
      travelTime: 12,
      coordinates: { lat: 52.3676, lng: 4.8776 },
    },
    capacity: { min: 20, max: 200, optimal: 80 },
    pricing: {
      basePrice: 1850,
      negotiatedRate: 1650,
      includes: ["Aula gebruik 2 uur", "Geluidssysteem", "Parkeren", "Koffie service"],
    },
    contact: {
      phone: "+31 20 123 4567",
      email: "info@westgaarde.nl",
      website: "www.westgaarde.nl",
      manager: "Dhr. van der Berg",
    },
    availability: {
      nextAvailable: "2024-01-18",
      busyDates: ["2024-01-19", "2024-01-20"],
      preferredTimes: ["10:00", "14:00", "16:00"],
    },
    amenities: ["Parkeren", "Toegankelijk", "Geluidssysteem", "Wifi", "Koffie", "Airco"],
    rating: 4.8,
    reviewCount: 127,
    images: [
      "/placeholder.svg?height=400&width=600&text=Aula+Hoofdzaal",
      "/placeholder.svg?height=400&width=600&text=Ontvangstruimte",
      "/placeholder.svg?height=400&width=600&text=Parkeerplaats",
      "/placeholder.svg?height=400&width=600&text=Buitenaanzicht",
    ],
    specializations: ["Multicultureel", "Muziek ceremonies", "Grote groepen"],
    description:
      "Westgaarde Crematorium is een moderne, respectvolle locatie in het hart van Amsterdam. Met ruime parkeergelegenheid en uitstekende bereikbaarheid is dit de perfecte keuze voor ceremonies tot 200 personen.",
    reviews: [
      {
        author: "Familie Jansen",
        rating: 5,
        date: "2023-12-15",
        comment: "Prachtige locatie, zeer professioneel en respectvol. Het personeel was uitstekend.",
      },
      {
        author: "Uitvaartonderneming De Vries",
        rating: 5,
        date: "2023-11-28",
        comment: "Altijd een plezier om hier te werken. Goede faciliteiten en flexibele medewerking.",
      },
    ],
  }

  const [selectedImage, setSelectedImage] = useState(0)

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Back Button */}
      <Button variant="outline" asChild className="mb-6">
        <Link href="/director/venues">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug naar overzicht
        </Link>
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900">{venue.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-orange-100 text-orange-800">🔥 {venue.type}</Badge>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">
                      {venue.location.city} • {venue.location.distance}km
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-lg">{venue.rating}</span>
                  <span className="text-slate-500">({venue.reviewCount} reviews)</span>
                </div>
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4 mr-1" />
                  Favoriet
                </Button>
              </div>
            </div>
          </div>

          {/* Image Gallery */}
          <Card>
            <CardContent className="p-0">
              <div className="relative">
                <img
                  src={venue.images[selectedImage] || "/placeholder.svg"}
                  alt={venue.name}
                  className="w-full h-96 object-cover rounded-t-lg"
                />
                <div className="absolute bottom-4 left-4 flex gap-2">
                  {venue.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-3 h-3 rounded-full ${selectedImage === index ? "bg-white" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-4 gap-2">
                  {venue.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative rounded-lg overflow-hidden ${
                        selectedImage === index ? "ring-2 ring-blue-500" : ""
                      }`}
                    >
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`${venue.name} ${index + 1}`}
                        className="w-full h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Tabs */}
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overzicht</TabsTrigger>
              <TabsTrigger value="amenities">Faciliteiten</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="availability">Beschikbaarheid</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-slate-700 leading-relaxed">{venue.description}</p>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Capaciteit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Minimum:</span>
                        <span className="font-medium">{venue.capacity.min} personen</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maximum:</span>
                        <span className="font-medium">{venue.capacity.max} personen</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Optimaal:</span>
                        <span className="font-medium text-green-600">{venue.capacity.optimal} personen</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Specialisaties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {venue.specializations.map((spec) => (
                        <Badge key={spec} variant="secondary">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="amenities">
              <Card>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {venue.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          {amenity === "Parkeren" && <Car className="h-4 w-4 text-green-600" />}
                          {amenity === "Wifi" && <Wifi className="h-4 w-4 text-green-600" />}
                          {amenity === "Koffie" && <Coffee className="h-4 w-4 text-green-600" />}
                          {amenity === "Toegankelijk" && <Accessibility className="h-4 w-4 text-green-600" />}
                        </div>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-4">
                {venue.reviews.map((review, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-medium">{review.author}</div>
                          <div className="text-sm text-slate-500">{review.date}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-700">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="availability">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Eerstvolgende beschikbaarheid</h3>
                      <div className="text-green-600 font-medium">{venue.availability.nextAvailable}</div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Voorkeurstijden</h3>
                      <div className="flex gap-2">
                        {venue.availability.preferredTimes.map((time) => (
                          <Badge key={time} variant="outline">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Prijzen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  {venue.pricing.negotiatedRate ? (
                    <div>
                      <div className="text-2xl font-bold text-green-600">€{venue.pricing.negotiatedRate}</div>
                      <div className="text-sm text-slate-400 line-through">€{venue.pricing.basePrice}</div>
                      <div className="text-sm text-green-600 font-medium">Uw speciale tarief</div>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold">€{venue.pricing.basePrice}</div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Inbegrepen:</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {venue.pricing.includes.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-medium">{venue.contact.manager}</div>
                <div className="text-sm text-slate-600">Locatie manager</div>
              </div>
              <Button className="w-full" asChild>
                <a href={`tel:${venue.contact.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  {venue.contact.phone}
                </a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href={`mailto:${venue.contact.email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  E-mail versturen
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Locatie Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="text-sm">{venue.location.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-slate-400" />
                <span className="text-sm">{venue.location.travelTime} minuten rijden</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-sm">Tot {venue.capacity.max} gasten</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button className="w-full" size="lg" asChild>
              <Link href={`/director/venues/${venue.id}/book`}>
                <Calendar className="h-4 w-4 mr-2" />
                Nu Boeken
              </Link>
            </Button>
            <Button variant="outline" className="w-full">
              <Camera className="h-4 w-4 mr-2" />
              360° Rondleiding
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
