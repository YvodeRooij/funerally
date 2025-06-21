"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MessageSquare, Send } from "lucide-react"

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    urgency: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("Form submitted:", formData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Stuur ons een bericht
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-base">
                Naam *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-base">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="mt-2"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone" className="text-base">
              Telefoonnummer
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="mt-2"
              placeholder="06-12345678"
            />
          </div>

          <div>
            <Label className="text-base">Urgentie</Label>
            <RadioGroup
              value={formData.urgency}
              onValueChange={(value) => handleInputChange("urgency", value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="urgent" id="urgent" />
                <Label htmlFor="urgent">Urgent - uitvaart binnen 48 uur</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="soon" id="soon" />
                <Label htmlFor="soon">Binnenkort - binnen een week</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="planning" id="planning" />
                <Label htmlFor="planning">Planning - meer dan een week</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="general" id="general" />
                <Label htmlFor="general">Algemene vraag</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="subject" className="text-base">
              Onderwerp
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              className="mt-2"
              placeholder="Waar kunnen we u mee helpen?"
            />
          </div>

          <div>
            <Label htmlFor="message" className="text-base">
              Bericht *
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              className="mt-2"
              rows={5}
              placeholder="Vertel ons hoe we u kunnen helpen..."
              required
            />
          </div>

          <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-800">
            <Send className="h-4 w-4 mr-2" />
            Bericht versturen
          </Button>

          <p className="text-sm text-slate-500 text-center">
            We reageren binnen 2 uur op urgente berichten, binnen 24 uur op andere vragen.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
