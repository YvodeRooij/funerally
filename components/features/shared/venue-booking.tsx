"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Users, Euro } from "lucide-react"

export function VenueBooking() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Locatie boeken</h1>
        <p className="text-muted-foreground">Uitvaartcentrum De Roos - Amsterdam</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Boekingsgegevens</CardTitle>
          <CardDescription>Vul uw gegevens in voor de boeking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Datum</Label>
              <Input id="date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Tijd</Label>
              <Input id="time" type="time" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duur (uren)</Label>
              <Input id="duration" type="number" placeholder="2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guests">Aantal gasten</Label>
              <Input id="guests" type="number" placeholder="50" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Contactpersoon</Label>
            <Input id="contactName" placeholder="Uw naam" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoonnummer</Label>
              <Input id="phone" placeholder="06-12345678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input id="email" type="email" placeholder="uw@email.nl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Bijzondere wensen (optioneel)</Label>
            <Textarea id="notes" placeholder="Eventuele speciale verzoeken of opmerkingen" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overzicht boeking</CardTitle>
          <CardDescription>Controleer uw boekingsgegevens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Datum</span>
            </div>
            <span className="font-medium">Woensdag 24 januari 2024</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Tijd</span>
            </div>
            <span className="font-medium">14:00 - 16:00 (2 uur)</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Aantal gasten</span>
            </div>
            <span className="font-medium">50 personen</span>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <div className="flex items-center space-x-2">
                <Euro className="h-5 w-5" />
                <span>Totaal</span>
              </div>
              <span>€700</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">€350 per dag × 2 uur = €700</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-4">
        <Button variant="outline" className="flex-1">
          Terug
        </Button>
        <Button className="flex-1">Boeking bevestigen</Button>
      </div>
    </div>
  )
}
