"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, Euro } from "lucide-react"

export function VenueDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Locatie Dashboard</h1>
        <Button>Beschikbaarheid bijwerken</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boekingen deze maand</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+3 vs vorige maand</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bezettingsgraad</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
            <p className="text-xs text-muted-foreground">Deze maand</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Omzet</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€2.450</div>
            <p className="text-xs text-muted-foreground">Deze maand</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gemiddelde beoordeling</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">Uit 24 beoordelingen</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Komende boekingen</CardTitle>
            <CardDescription>Uw planning voor de komende dagen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Morgen 14:00 - 16:00</p>
                  <p className="text-xs text-muted-foreground">Familie Jansen - Uitvaartdienst</p>
                </div>
                <div className="text-sm font-medium">€350</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Vrijdag 10:00 - 12:00</p>
                  <p className="text-xs text-muted-foreground">Familie de Wit - Condoleance</p>
                </div>
                <div className="text-sm font-medium">€200</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beschikbaarheid</CardTitle>
            <CardDescription>Uw openingstijden en beschikbaarheid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Maandag - Vrijdag</span>
                <span className="text-sm text-muted-foreground">09:00 - 17:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Zaterdag</span>
                <span className="text-sm text-muted-foreground">10:00 - 16:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Zondag</span>
                <span className="text-sm text-muted-foreground">Gesloten</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
