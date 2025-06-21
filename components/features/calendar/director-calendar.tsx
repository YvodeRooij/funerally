"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight } from "lucide-react"

export function DirectorCalendar() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Beheer uw afspraken en planning</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe afspraak
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Januari 2024
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                <div className="text-center text-sm font-medium text-muted-foreground p-2">Ma</div>
                <div className="text-center text-sm font-medium text-muted-foreground p-2">Di</div>
                <div className="text-center text-sm font-medium text-muted-foreground p-2">Wo</div>
                <div className="text-center text-sm font-medium text-muted-foreground p-2">Do</div>
                <div className="text-center text-sm font-medium text-muted-foreground p-2">Vr</div>
                <div className="text-center text-sm font-medium text-muted-foreground p-2">Za</div>
                <div className="text-center text-sm font-medium text-muted-foreground p-2">Zo</div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 31 }, (_, i) => (
                  <div
                    key={i}
                    className="aspect-square p-2 text-center text-sm border rounded hover:bg-muted cursor-pointer"
                  >
                    <div className="font-medium">{i + 1}</div>
                    {i === 14 && <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-1"></div>}
                    {i === 21 && <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></div>}
                    {i === 25 && <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mt-1"></div>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Vandaag
              </CardTitle>
              <CardDescription>Maandag 22 januari</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">10:00 - Familie Jansen</p>
                    <p className="text-xs text-muted-foreground">Eerste gesprek</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">14:30 - Familie de Wit</p>
                    <p className="text-xs text-muted-foreground">Nazorg gesprek</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">16:00 - Locatie bezoek</p>
                    <p className="text-xs text-muted-foreground">Crematorium Westerveld</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deze week</CardTitle>
              <CardDescription>Komende afspraken</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Woensdag</p>
                    <p className="text-xs text-muted-foreground">Familie Pietersen</p>
                  </div>
                  <Badge variant="outline">09:30</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Vrijdag</p>
                    <p className="text-xs text-muted-foreground">Familie van der Berg</p>
                  </div>
                  <Badge variant="outline">11:00</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Zaterdag</p>
                    <p className="text-xs text-muted-foreground">Uitvaartdienst</p>
                  </div>
                  <Badge variant="outline">13:00</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
