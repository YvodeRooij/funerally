"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Euro } from "lucide-react"

export function VenueBookings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Boekingen</h1>
          <p className="text-muted-foreground">Overzicht van al uw boekingen</p>
        </div>
        <Button>Nieuwe boeking</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal boekingen</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Deze maand</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bevestigd</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">75% van totaal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In behandeling</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Wacht op bevestiging</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Omzet</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€8.450</div>
            <p className="text-xs text-muted-foreground">Deze maand</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recente boekingen</CardTitle>
          <CardDescription>Uw laatste boekingen en hun status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-medium">Familie van der Berg</p>
                  <p className="text-sm text-muted-foreground">Maandag 22 jan, 14:00 - 16:00</p>
                  <p className="text-sm text-muted-foreground">Uitvaartdienst</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium">€350</p>
                  <p className="text-sm text-muted-foreground">2 uur</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Bevestigd</Badge>
                <Button variant="outline" size="sm">
                  Details
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-medium">Familie Jansen</p>
                  <p className="text-sm text-muted-foreground">Woensdag 24 jan, 10:00 - 12:00</p>
                  <p className="text-sm text-muted-foreground">Condoleance bijeenkomst</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium">€200</p>
                  <p className="text-sm text-muted-foreground">2 uur</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">In behandeling</Badge>
                <Button variant="outline" size="sm">
                  Details
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-medium">Familie de Wit</p>
                  <p className="text-sm text-muted-foreground">Vrijdag 26 jan, 15:00 - 17:00</p>
                  <p className="text-sm text-muted-foreground">Herdenkingsdienst</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium">€275</p>
                  <p className="text-sm text-muted-foreground">2 uur</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Bevestigd</Badge>
                <Button variant="outline" size="sm">
                  Details
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-medium">Familie Pietersen</p>
                  <p className="text-sm text-muted-foreground">Zaterdag 27 jan, 11:00 - 13:00</p>
                  <p className="text-sm text-muted-foreground">Uitvaartdienst</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium">€400</p>
                  <p className="text-sm text-muted-foreground">2 uur</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Nieuw</Badge>
                <Button variant="outline" size="sm">
                  Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
