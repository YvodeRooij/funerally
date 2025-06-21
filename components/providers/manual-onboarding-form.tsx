"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Building, Save } from "lucide-react"
import Link from "next/link"

export function ManualOnboardingForm() {
  const [formData, setFormData] = useState({
    companyName: "",
    kvkNumber: "",
    address: "",
    postalCode: "",
    city: "",
    phone: "",
    email: "",
    website: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Submit to API endpoint
    console.log("Manual form submitted:", formData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <Link href="/providers/onboarding" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug naar document upload
        </Link>
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Handmatige Aanmelding</h1>
            <p className="text-slate-600">Vul uw bedrijfsgegevens handmatig in</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bedrijfsgegevens</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Bedrijfsnaam *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  placeholder="Uitvaartzorg Van der Berg B.V."
                  required
                />
              </div>
              <div>
                <Label htmlFor="kvkNumber">KvK Nummer *</Label>
                <Input
                  id="kvkNumber"
                  value={formData.kvkNumber}
                  onChange={(e) => handleChange("kvkNumber", e.target.value)}
                  placeholder="12345678"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Adres *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Hoofdstraat 156"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode">Postcode *</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  placeholder="3811 EP"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">Plaats *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Amersfoort"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefoon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="033-4567890"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="info@vandenberg-uitvaart.nl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="www.vandenberg-uitvaart.nl"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Gegevens Opslaan
              </Button>
              <Link href="/providers/onboarding">
                <Button type="button" variant="outline">
                  Annuleren
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
