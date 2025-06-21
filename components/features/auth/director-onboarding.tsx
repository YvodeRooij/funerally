"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

export function DirectorOnboarding() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welkom als uitvaartondernemer</h1>
        <p className="text-muted-foreground mt-2">Laten we uw profiel instellen</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bedrijfsinformatie</CardTitle>
              <CardDescription>Vertel ons over uw onderneming</CardDescription>
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
            <Label htmlFor="companyName">Bedrijfsnaam</Label>
            <Input id="companyName" placeholder="Naam van uw uitvaartonderneming" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kvkNumber">KvK nummer</Label>
            <Input id="kvkNumber" placeholder="12345678" />
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
            <Label htmlFor="address">Bedrijfsadres</Label>
            <Input id="address" placeholder="Straat en huisnummer" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode">Postcode</Label>
              <Input id="zipCode" placeholder="1234 AB" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Plaats</Label>
              <Input id="city" placeholder="Uw vestigingsplaats" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Jaren ervaring</Label>
            <Input id="experience" type="number" placeholder="Aantal jaren in de uitvaartbranche" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Korte beschrijving</Label>
            <Textarea id="bio" placeholder="Vertel iets over uzelf en uw aanpak" />
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
