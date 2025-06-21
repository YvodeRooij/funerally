"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react"

export function VenueAvailability() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Beschikbaarheid</h1>
          <p className="text-muted-foreground">Beheer uw openingstijden en beschikbaarheid</p>
        </div>
        <Button>Beschikbaarheid bijwerken</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Openingstijden
            </CardTitle>
            <CardDescription>Uw standaard openingstijden</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Maandag</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">09:00 - 17:00</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Dinsdag</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">09:00 - 17:00</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Woensdag</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">09:00 - 17:00</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Donderdag</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">09:00 - 17:00</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Vrijdag</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">09:00 - 17:00</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Zaterdag</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">10:00 - 16:00</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Zondag</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Gesloten</span>
                  <XCircle className="h-4 w-4 text-red-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Kalender overzicht
            </CardTitle>
            <CardDescription>Uw boekingen voor deze week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Maandag 22 januari</p>
                    <p className="text-sm text-muted-foreground">14:00 - 16:00</p>
                    <p className="text-sm">Familie Jansen</p>
                  </div>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Bevestigd</div>
                </div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Woensdag 24 januari</p>
                    <p className="text-sm text-muted-foreground">10:00 - 12:00</p>
                    <p className="text-sm">Familie de Wit</p>
                  </div>
                  <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">In behandeling</div>
                </div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Vrijdag 26 januari</p>
                    <p className="text-sm text-muted-foreground">15:00 - 17:00</p>
                    <p className="text-sm">Familie Pietersen</p>
                  </div>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Bevestigd</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
