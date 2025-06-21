"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { MapPin, Users, Euro, Star, Calendar } from "lucide-react"

interface VenueFiltersProps {
  userType: "family" | "director"
}

export function VenueFilters({ userType }: VenueFiltersProps) {
  const [priceRange, setPriceRange] = useState([500, 3000])
  const [capacityRange, setCapacityRange] = useState([20, 200])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [minRating, setMinRating] = useState(4.0)
  const [maxDistance, setMaxDistance] = useState(25)

  const venueTypes = [
    { id: "crematorium", label: "Crematorium", icon: "🔥", count: 45 },
    { id: "begraafplaats", label: "Begraafplaats", icon: "🌳", count: 32 },
    { id: "uitvaartcentrum", label: "Uitvaartcentrum", icon: "🏛️", count: 28 },
    { id: "kerk", label: "Kerk", icon: "⛪", count: 67 },
    { id: "bijzonder", label: "Bijzondere locatie", icon: "✨", count: 15 },
  ]

  const amenities = [
    "Parkeren",
    "Toegankelijk",
    "Geluidssysteem",
    "Wifi",
    "Koffie service",
    "Catering mogelijk",
    "Airco",
    "Natuurlijke omgeving",
    "Moderne faciliteiten",
  ]

  const toggleType = (typeId: string) => {
    setSelectedTypes((prev) => (prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]))
  }

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) => (prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]))
  }

  const clearAllFilters = () => {
    setPriceRange([500, 3000])
    setCapacityRange([20, 200])
    setSelectedTypes([])
    setSelectedAmenities([])
    setMinRating(4.0)
    setMaxDistance(25)
  }

  const activeFiltersCount =
    selectedTypes.length +
    selectedAmenities.length +
    (priceRange[0] !== 500 || priceRange[1] !== 3000 ? 1 : 0) +
    (capacityRange[0] !== 20 || capacityRange[1] !== 200 ? 1 : 0) +
    (minRating !== 4.0 ? 1 : 0) +
    (maxDistance !== 25 ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{activeFiltersCount} actief</Badge>
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Wissen
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Locatie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Maximale afstand</Label>
            <div className="mt-2">
              <Slider
                value={[maxDistance]}
                onValueChange={(value) => setMaxDistance(value[0])}
                max={50}
                min={5}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>5km</span>
                <span className="font-medium">{maxDistance}km</span>
                <span>50km</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Venue Types */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Type locatie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {venueTypes.map((type) => (
              <div key={type.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={selectedTypes.includes(type.id)}
                    onCheckedChange={() => toggleType(type.id)}
                  />
                  <Label htmlFor={type.id} className="flex items-center gap-2 cursor-pointer">
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </Label>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {type.count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Euro className="h-4 w-4" />
            Prijsbereik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={5000}
              min={500}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-sm">
              <span className="font-medium">€{priceRange[0]}</span>
              <span className="font-medium">€{priceRange[1]}+</span>
            </div>
            {userType === "director" && (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                💡 Prijzen tonen uw onderhandelde tarieven waar beschikbaar
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Capacity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Capaciteit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Slider
              value={capacityRange}
              onValueChange={setCapacityRange}
              max={500}
              min={10}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-sm">
              <span className="font-medium">{capacityRange[0]} personen</span>
              <span className="font-medium">{capacityRange[1]}+ personen</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4" />
            Minimale beoordeling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[4.5, 4.0, 3.5, 3.0].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={minRating <= rating}
                  onCheckedChange={() => setMinRating(rating)}
                />
                <Label htmlFor={`rating-${rating}`} className="flex items-center gap-1 cursor-pointer">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
                      />
                    ))}
                  </div>
                  <span>{rating}+ sterren</span>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Faciliteiten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {amenities.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity}
                  checked={selectedAmenities.includes(amenity)}
                  onCheckedChange={() => toggleAmenity(amenity)}
                />
                <Label htmlFor={amenity} className="cursor-pointer">
                  {amenity}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      {userType === "director" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Beschikbaarheid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="available-today" />
                <Label htmlFor="available-today">Vandaag beschikbaar</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="available-week" />
                <Label htmlFor="available-week">Deze week beschikbaar</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="instant-booking" />
                <Label htmlFor="instant-booking">Direct boeken mogelijk</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
