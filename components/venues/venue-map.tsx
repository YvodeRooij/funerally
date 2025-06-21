"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Star, List } from "lucide-react"

interface VenueMapProps {
  userType: "family" | "director"
}

export function VenueMap({ userType }: VenueMapProps) {
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null)

  // Mock venues with coordinates
  const venues = [
    {
      id: "1",
      name: "Westgaarde Crematorium",
      type: "crematorium",
      coordinates: { lat: 52.3676, lng: 4.8776 },
      price: userType === "director" ? 1650 : 1850,
      rating: 4.9,
      image: "/placeholder.svg?height=150&width=200&text=Westgaarde",
    },
    {
      id: "2",
      name: "Begraafplaats Zorgvlied",
      type: "begraafplaats",
      coordinates: { lat: 52.3376, lng: 4.8576 },
      price: userType === "director" ? 950 : 1100,
      rating: 4.7,
      image: "/placeholder.svg?height=150&width=200&text=Zorgvlied",
    },
    {
      id: "3",
      name: "De Nieuwe Ooster",
      type: "uitvaartcentrum",
      coordinates: { lat: 52.3576, lng: 4.9276 },
      price: userType === "director" ? 1950 : 2200,
      rating: 4.8,
      image: "/placeholder.svg?height=150&width=200&text=Nieuwe+Ooster",
    },
  ]

  return (
    <div className="relative h-[600px] bg-slate-100 rounded-lg overflow-hidden">
      {/* Map Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">Interactieve Kaart</h3>
          <p className="text-slate-500">Google Maps integratie wordt hier geladen</p>
          <p className="text-sm text-slate-400 mt-2">
            Toon alle {venues.length} locaties op de kaart met real-time beschikbaarheid
          </p>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 left-4 space-y-2">
        <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-50">
          <List className="h-4 w-4 mr-2" />
          Terug naar lijst
        </Button>
      </div>

      {/* Venue Markers (Mock positions) */}
      {venues.map((venue, index) => (
        <div
          key={venue.id}
          className={`absolute w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform ${
            selectedVenue === venue.id ? "ring-4 ring-blue-300" : ""
          }`}
          style={{
            left: `${30 + index * 20}%`,
            top: `${40 + index * 15}%`,
          }}
          onClick={() => setSelectedVenue(venue.id)}
        >
          <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
            €{Math.round(venue.price / 100)}
          </div>
        </div>
      ))}

      {/* Selected Venue Card */}
      {selectedVenue && (
        <div className="absolute bottom-4 left-4 right-4">
          <Card className="shadow-xl">
            <CardContent className="p-4">
              {(() => {
                const venue = venues.find((v) => v.id === selectedVenue)!
                return (
                  <div className="flex gap-4">
                    <img
                      src={venue.image || "/placeholder.svg"}
                      alt={venue.name}
                      className="w-24 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{venue.name}</h3>
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{venue.rating}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">€{venue.price}</div>
                          <div className="text-xs text-slate-500">vanaf</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          Bekijk Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <MapPin className="h-3 w-3 mr-1" />
                          Route
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
