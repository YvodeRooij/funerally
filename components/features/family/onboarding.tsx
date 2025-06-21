"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

export function FamilyOnboarding() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welkom bij ons platform</h1>
        <p className="text-muted-foreground mt-2">We helpen u stap voor stap door dit proces</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Persoonlijke informatie</CardTitle>
              <CardDescription>Vertel ons iets over uzelf</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">Stap 1 van 3</div>
          </div>
          <Progress value={33} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Voornaam</Label>
              <Input id="firstName" placeholder="Uw voornaam" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Achternaam</Label>
              <Input id="lastName" placeholder="Uw achternaam" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input id="email" type="email" placeholder="uw@email.nl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefoonnummer</Label>
            <Input id="phone" placeholder="06-12345678" />
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
              <Input id="city" placeholder="Uw woonplaats" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Aanvullende informatie (optioneel)</Label>
            <Textarea id="notes" placeholder="Is er iets speciaals dat we moeten weten?" />
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
