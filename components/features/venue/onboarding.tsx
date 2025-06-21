"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"

export function VenueOnboarding() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welkom als locatiepartner</h1>
        <p className="text-muted-foreground mt-2">Laten we uw locatie instellen</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Locatie informatie</CardTitle>
              <CardDescription>Vertel ons over uw locatie</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">Stap 1 van 3</div>
          </div>
          <Progress value={33} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venueName">Naam van de locatie</Label>
            <Input id="venueName" placeholder="Bijv. Uitvaartcentrum De Roos" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venueType">Type locatie</Label>
            <Input id="venueType" placeholder="Bijv. Uitvaartcentrum, Aula, Crematorium" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Input id="address" placeholder="Straat en huisnummer" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode">Postcode</Label>
              <Input id="zipCode" placeholder="1234 AB" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Plaats</Label>
              <Input id="city" placeholder="Stad" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capaciteit</Label>
              <Input id="capacity" type="number" placeholder="Aantal personen" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerHour">Prijs per uur</Label>
              <Input id="pricePerHour" type="number" placeholder="€ per uur" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea id="description" placeholder="Beschrijf uw locatie en wat deze bijzonder maakt" />
          </div>

          <div className="space-y-3">
            <Label>Voorzieningen</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="parking" />
                <Label htmlFor="parking">Parkeren</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="accessible" />
                <Label htmlFor="accessible">Toegankelijk</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="catering" />
                <Label htmlFor="catering">Catering mogelijk</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="music" />
                <Label htmlFor="music">Muziekinstallatie</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="projector" />
                <Label htmlFor="projector">Beamer/Projector</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="garden" />
                <Label htmlFor="garden">Tuin/Buitenruimte</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline">Vorige</Button>
            <Button>Volgende stap</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
