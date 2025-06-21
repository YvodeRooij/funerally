"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building, Users, Euro, Star, Save, Edit3, Calendar, Camera, Wifi, Car, Coffee, Music } from "lucide-react"
import { useSession } from "next-auth/react"

interface VenueProfileProps {
  user: any
}

const amenities = [
  { key: "parking", label: "Parkeerplaats", icon: Car },
  { key: "wifi", label: "WiFi", icon: Wifi },
  { key: "catering", label: "Catering mogelijk", icon: Coffee },
  { key: "sound", label: "Geluidssysteem", icon: Music },
  { key: "wheelchair", label: "Rolstoeltoegankelijk", icon: Users },
  { key: "garden", label: "Tuin/Buitenruimte", icon: Building },
]

const venueTypes = [
  "Uitvaartcentrum",
  "Kerk",
  "Crematorium",
  "Begraafplaats",
  "Gemeenschapshuis",
  "Hotel",
  "Restaurant",
  "Cultureel centrum",
]

export function VenueProfile({ user }: VenueProfileProps) {
  const { update } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: user.name || "",
    email: user.email || "",
    venueName: "Uitvaartcentrum De Roos",
    venueType: "Uitvaartcentrum",
    address: "Kerkstraat 45, 2345 CD Utrecht",
    phone: "+31 30 123 4567",
    website: "www.uitvaartcentrumderoos.nl",
    description:
      "Een serene en respectvolle omgeving voor het afscheid nemen van dierbaren. Ons centrum biedt moderne faciliteiten in een warme, huiselijke sfeer.",
    capacity: "150",
    pricePerHour: "125",
    minimumHours: "3",
    amenities: ["parking", "wifi", "catering", "sound"],
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false,
    },
    rating: 4.6,
    totalBookings: 89,
    totalReviews: 34,
  })

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setProfile((prev) => ({
      ...prev,
      amenities: checked ? [...prev.amenities, amenity] : prev.amenities.filter((a) => a !== amenity),
    }))
  }

  const handleSave = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        await update({ name: profile.name })
        setIsEditing(false)
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image || "/placeholder.svg"} />
              <AvatarFallback className="bg-green-100 text-green-600">
                <Building className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Locatie Profiel</h1>
              <p className="text-slate-600">Beheer uw locatie informatie en beschikbaarheid</p>
            </div>
          </div>
          <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "outline" : "default"}>
            <Edit3 className="h-4 w-4 mr-2" />
            {isEditing ? "Annuleren" : "Bewerken"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Venue Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-green-600" />
                Locatie Informatie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="venueName">Locatie Naam</Label>
                  <Input
                    id="venueName"
                    value={profile.venueName}
                    onChange={(e) => setProfile((prev) => ({ ...prev, venueName: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="venueType">Type Locatie</Label>
                  <select
                    id="venueType"
                    value={profile.venueType}
                    onChange={(e) => setProfile((prev) => ({ ...prev, venueType: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {venueTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="capacity">Capaciteit (personen)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={profile.capacity}
                    onChange={(e) => setProfile((prev) => ({ ...prev, capacity: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefoonnummer</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mailadres</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile((prev) => ({ ...prev, website: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="www.uwlocatie.nl"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Adres</Label>
                <Textarea
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditing}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => setProfile((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Beschrijf uw locatie en wat deze bijzonder maakt..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Availability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5 text-green-600" />
                  Prijzen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pricePerHour">Prijs per uur (€)</Label>
                  <Input
                    id="pricePerHour"
                    type="number"
                    value={profile.pricePerHour}
                    onChange={(e) => setProfile((prev) => ({ ...prev, pricePerHour: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="minimumHours">Minimum aantal uren</Label>
                  <Input
                    id="minimumHours"
                    type="number"
                    value={profile.minimumHours}
                    onChange={(e) => setProfile((prev) => ({ ...prev, minimumHours: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Beschikbaarheid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { key: "monday", label: "Maandag" },
                    { key: "tuesday", label: "Dinsdag" },
                    { key: "wednesday", label: "Woensdag" },
                    { key: "thursday", label: "Donderdag" },
                    { key: "friday", label: "Vrijdag" },
                    { key: "saturday", label: "Zaterdag" },
                    { key: "sunday", label: "Zondag" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={profile.availability[key as keyof typeof profile.availability]}
                        onCheckedChange={(checked) =>
                          setProfile((prev) => ({
                            ...prev,
                            availability: { ...prev.availability, [key]: checked as boolean },
                          }))
                        }
                        disabled={!isEditing}
                      />
                      <Label htmlFor={key}>{label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Faciliteiten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {amenities.map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={profile.amenities.includes(key)}
                      onCheckedChange={(checked) => handleAmenityChange(key, checked as boolean)}
                      disabled={!isEditing}
                    />
                    <Label htmlFor={key} className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {isEditing && (
            <div className="flex gap-3">
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Wijzigingen Opslaan
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuleren
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Prestaties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="h-5 w-5 text-amber-400 fill-current" />
                  <span className="text-2xl font-bold">{profile.rating}</span>
                </div>
                <p className="text-sm text-slate-600">{profile.totalReviews} beoordelingen</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{profile.totalBookings}</div>
                <p className="text-sm text-green-600">Totaal boekingen</p>
              </div>
            </CardContent>
          </Card>

          {/* Active Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Actieve Faciliteiten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.amenities.map((amenityKey) => {
                  const amenity = amenities.find((a) => a.key === amenityKey)
                  return amenity ? (
                    <Badge key={amenityKey} variant="secondary" className="flex items-center gap-1">
                      <amenity.icon className="h-3 w-3" />
                      {amenity.label}
                    </Badge>
                  ) : null
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Snelle Acties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Camera className="h-4 w-4 mr-2" />
                Foto's Uploaden
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Agenda Beheren
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Star className="h-4 w-4 mr-2" />
                Reviews Bekijken
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
