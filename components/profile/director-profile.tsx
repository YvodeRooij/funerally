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
import { User, Building, Star, Euro, Clock, Save, Edit3, Award, MapPin } from "lucide-react"
import { useSession } from "next-auth/react"

interface DirectorProfileProps {
  user: any
}

const specializations = [
  "Begrafenis",
  "Crematie",
  "Natuurbegrafenis",
  "Uitvaart thuis",
  "Islamitische uitvaart",
  "Joodse uitvaart",
  "Hindoeïstische uitvaart",
  "Boeddhistische uitvaart",
  "Humanistische uitvaart",
  "Rouwbegeleiding",
  "Kinderuitvaart",
  "Persoonlijke ceremonie",
  "Groene uitvaart",
  "Zee-uitvaart",
]

export function DirectorProfile({ user }: DirectorProfileProps) {
  const { update } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: "+31 20 123 4567",
    company: "De Vries Uitvaart",
    kvkNumber: "12345678",
    address: "Hoofdstraat 123, 1234 AB Amsterdam",
    bio: "Met meer dan 15 jaar ervaring begeleid ik families door een van de moeilijkste periodes van hun leven. Mijn aanpak is persoonlijk, respectvol en professioneel.",
    specializations: ["Begrafenis", "Crematie", "Rouwbegeleiding"],
    yearsExperience: "15",
    priceRange: { min: "2500", max: "8500" },
    availability: {
      weekdays: true,
      weekends: true,
      evenings: true,
      emergency: true,
    },
    rating: 4.8,
    totalReviews: 127,
    completedServices: 342,
  })

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    setProfile((prev) => ({
      ...prev,
      specializations: checked
        ? [...prev.specializations, specialization]
        : prev.specializations.filter((s) => s !== specialization),
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
              <AvatarFallback className="bg-blue-100 text-blue-600">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Uitvaartondernemer Profiel</h1>
              <p className="text-slate-600">Beheer uw professionele profiel en dienstverlening</p>
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
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                Bedrijfsgegevens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Volledige Naam</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Bedrijfsnaam</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile((prev) => ({ ...prev, company: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="kvk">KvK Nummer</Label>
                  <Input
                    id="kvk"
                    value={profile.kvkNumber}
                    onChange={(e) => setProfile((prev) => ({ ...prev, kvkNumber: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Jaren Ervaring</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={profile.yearsExperience}
                    onChange={(e) => setProfile((prev) => ({ ...prev, yearsExperience: e.target.value }))}
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
              </div>
              <div>
                <Label htmlFor="address">Bedrijfsadres</Label>
                <Textarea
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditing}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="bio">Persoonlijke Beschrijving</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Vertel families over uw aanpak en ervaring..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Specializations */}
          <Card>
            <CardHeader>
              <CardTitle>Specialisaties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {specializations.map((specialization) => (
                  <div key={specialization} className="flex items-center space-x-2">
                    <Checkbox
                      id={specialization}
                      checked={profile.specializations.includes(specialization)}
                      onCheckedChange={(checked) => handleSpecializationChange(specialization, checked as boolean)}
                      disabled={!isEditing}
                    />
                    <Label htmlFor={specialization} className="text-sm">
                      {specialization}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Availability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5 text-green-600" />
                  Prijsindicatie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minPrice">Vanaf (€)</Label>
                    <Input
                      id="minPrice"
                      type="number"
                      value={profile.priceRange.min}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, min: e.target.value },
                        }))
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxPrice">Tot (€)</Label>
                    <Input
                      id="maxPrice"
                      type="number"
                      value={profile.priceRange.max}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, max: e.target.value },
                        }))
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Beschikbaarheid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { key: "weekdays", label: "Werkdagen" },
                    { key: "weekends", label: "Weekenden" },
                    { key: "evenings", label: "Avonden" },
                    { key: "emergency", label: "24/7 Spoed" },
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

          {isEditing && (
            <div className="flex gap-3">
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
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
                <Award className="h-5 w-5 text-amber-500" />
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
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{profile.completedServices}</div>
                <p className="text-sm text-blue-600">Voltooide diensten</p>
              </div>
            </CardContent>
          </Card>

          {/* Selected Specializations */}
          <Card>
            <CardHeader>
              <CardTitle>Actieve Specialisaties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.specializations.map((spec) => (
                  <Badge key={spec} variant="secondary">
                    {spec}
                  </Badge>
                ))}
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
                <Star className="h-4 w-4 mr-2" />
                Beoordelingen Bekijken
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MapPin className="h-4 w-4 mr-2" />
                Werkgebied Instellen
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Award className="h-4 w-4 mr-2" />
                Certificaten Uploaden
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
