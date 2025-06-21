"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { User, Star, Clock, Euro, Save } from "lucide-react"
import Link from "next/link"

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

export function DirectorProfileForm() {
  const [profile, setProfile] = useState({
    bio: "",
    specializations: [] as string[],
    yearsExperience: "",
    priceRange: { min: "", max: "" },
    availability: {
      weekdays: true,
      weekends: true,
      evenings: true,
      emergency: true,
    },
    languages: [] as string[],
  })

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    setProfile((prev) => ({
      ...prev,
      specializations: checked
        ? [...prev.specializations, specialization]
        : prev.specializations.filter((s) => s !== specialization),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Submit to API endpoint
    console.log("Profile updated:", profile)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Profiel Aanvullen</h1>
            <p className="text-slate-600">Maak uw profiel compleet om meer families te bereiken</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Over Uw Dienstverlening
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bio">Persoonlijke Beschrijving</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Vertel families over uw aanpak, ervaring en wat u uniek maakt..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="experience">Jaren Ervaring</Label>
                <Input
                  id="experience"
                  type="number"
                  value={profile.yearsExperience}
                  onChange={(e) => setProfile((prev) => ({ ...prev, yearsExperience: e.target.value }))}
                  placeholder="15"
                />
              </div>
            </CardContent>
          </Card>

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
                    />
                    <Label htmlFor={specialization} className="text-sm">
                      {specialization}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                      setProfile((prev) => ({ ...prev, priceRange: { ...prev.priceRange, min: e.target.value } }))
                    }
                    placeholder="2500"
                  />
                </div>
                <div>
                  <Label htmlFor="maxPrice">Tot (€)</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    value={profile.priceRange.max}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, priceRange: { ...prev.priceRange, max: e.target.value } }))
                    }
                    placeholder="8500"
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
                  { key: "weekdays", label: "Werkdagen (ma-vr)" },
                  { key: "weekends", label: "Weekenden" },
                  { key: "evenings", label: "Avonden" },
                  { key: "emergency", label: "Spoedgevallen (24/7)" },
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
                    />
                    <Label htmlFor={key}>{label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profiel Voortgang</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Basis gegevens</span>
                  <Badge className="bg-green-100 text-green-800">✓ Compleet</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Specialisaties</span>
                  <Badge
                    className={
                      profile.specializations.length > 0 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    }
                  >
                    {profile.specializations.length > 0 ? "✓ Compleet" : "Nog toe te voegen"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Beschrijving</span>
                  <Badge className={profile.bio ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                    {profile.bio ? "✓ Compleet" : "Nog toe te voegen"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Prijsindicatie</span>
                  <Badge
                    className={
                      profile.priceRange.min && profile.priceRange.max
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }
                  >
                    {profile.priceRange.min && profile.priceRange.max ? "✓ Compleet" : "Nog toe te voegen"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Geselecteerde Specialisaties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.specializations.length > 0 ? (
                  profile.specializations.map((spec) => (
                    <Badge key={spec} variant="secondary">
                      {spec}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Nog geen specialisaties geselecteerd</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Profiel Opslaan
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Naar Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
