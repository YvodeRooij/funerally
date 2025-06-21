"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Calendar, Home, Save, Edit3, Shield, Bell, Trash2, Plus, MessageCircle, Linkedin } from "lucide-react"
import { useSession } from "next-auth/react"

interface FamilyProfileProps {
  user: any
}

export function FamilyProfile({ user }: FamilyProfileProps) {
  const { update } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: "",
    address: "",
    emergencyContact: "",
    preferences: {
      notifications: true,
      emailUpdates: true,
      smsUpdates: false,
    },
    familyCode: "FAM-2024-001", // Mock family code
    connectedDirector: "Jan de Vries Uitvaart",
    // TODO: Add WhatsApp integration for family contacts
    // This will allow families to easily share contact information
    // and communicate through their preferred messaging platform
    contacts: [
      // Future: WhatsApp contacts integration
      // Future: LinkedIn MCP integration for professional network connections
    ],
  })

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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image || "/placeholder.svg"} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                <Home className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Familie Profiel</h1>
              <p className="text-slate-600">Beheer uw persoonlijke gegevens en voorkeuren</p>
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
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Persoonlijke Gegevens
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
                  <Label htmlFor="phone">Telefoonnummer</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="+31 6 12345678"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency">Noodcontact</Label>
                  <Input
                    id="emergency"
                    value={profile.emergencyContact}
                    onChange={(e) => setProfile((prev) => ({ ...prev, emergencyContact: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Naam en telefoonnummer"
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
                  placeholder="Straat, huisnummer, postcode, plaats"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Family Contacts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                Familie Contacten
                {/* TODO: WhatsApp Integration
                    - Add WhatsApp contact sync
                    - Allow families to easily add/share contacts
                    - Enable group messaging for family coordination
                    - Integrate with WhatsApp Business API for director communication
                */}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">WhatsApp Integratie</div>
                      <div className="text-sm text-slate-600">Binnenkort beschikbaar</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    Contacten Toevoegen
                  </Button>
                </div>

                {/* TODO: LinkedIn MCP Integration
                    - Future feature: LinkedIn MCP (Model Context Protocol) integration
                    - Allow professional network connections
                    - Enable sharing of professional funeral service providers
                    - Connect with LinkedIn profiles of funeral directors and venues
                */}
                <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                  <div className="flex items-center gap-3">
                    <Linkedin className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">LinkedIn Netwerk</div>
                      <div className="text-sm text-slate-600">Toekomstige functie - LinkedIn MCP</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    Netwerk Verbinden
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-600" />
                Notificatie Voorkeuren
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { key: "notifications", label: "Push notificaties", description: "Ontvang meldingen in de app" },
                  { key: "emailUpdates", label: "E-mail updates", description: "Belangrijke updates via e-mail" },
                  { key: "smsUpdates", label: "SMS berichten", description: "Urgente berichten via SMS" },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-slate-600">{description}</div>
                    </div>
                    <Button
                      variant={profile.preferences[key as keyof typeof profile.preferences] ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setProfile((prev) => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            [key]: !prev.preferences[key as keyof typeof prev.preferences],
                          },
                        }))
                      }
                      disabled={!isEditing}
                    >
                      {profile.preferences[key as keyof typeof profile.preferences] ? "Aan" : "Uit"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
          {/* Family Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Familie Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="font-mono text-lg font-bold text-green-800">{profile.familyCode}</div>
                <p className="text-sm text-green-600 mt-1">Deel deze code met uw uitvaartondernemer</p>
              </div>
            </CardContent>
          </Card>

          {/* Connected Director */}
          <Card>
            <CardHeader>
              <CardTitle>Verbonden Uitvaartondernemer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-blue-900">{profile.connectedDirector}</div>
                  <div className="text-sm text-blue-600">Actieve begeleiding</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Acties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Privacy Instellingen
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Afspraken Geschiedenis
              </Button>
              <Separator />
              <Button variant="destructive" className="w-full justify-start">
                <Trash2 className="h-4 w-4 mr-2" />
                Account Verwijderen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
