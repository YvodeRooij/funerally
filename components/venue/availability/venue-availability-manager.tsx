"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Calendar, Clock, Settings, FolderSyncIcon as Sync } from "lucide-react"

export function VenueAvailabilityManager() {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Calendar Sync */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agenda Synchronisatie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Google Calendar</h3>
                  <p className="text-sm text-slate-600">Automatische synchronisatie</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-800">Verbonden</Badge>
                <Switch checked />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Outlook Calendar</h3>
                  <p className="text-sm text-slate-600">Microsoft 365 integratie</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Niet verbonden</Badge>
                <Switch />
              </div>
            </div>

            <Button className="w-full">
              <Sync className="h-4 w-4 mr-2" />
              Nu Synchroniseren
            </Button>
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Beschikbare Tijdslots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-center text-sm">
              {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day) => (
                <div key={day} className="font-medium p-2">
                  {day}
                </div>
              ))}
              {/* Time slots would be rendered here */}
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="space-y-1">
                  <div className="p-2 bg-green-100 text-green-800 rounded text-xs">09:00</div>
                  <div className="p-2 bg-green-100 text-green-800 rounded text-xs">11:00</div>
                  <div className="p-2 bg-red-100 text-red-800 rounded text-xs">14:00</div>
                  <div className="p-2 bg-green-100 text-green-800 rounded text-xs">16:00</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Instellingen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Standaard tijdslots</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Ochtend (09:00-12:00)</span>
                  <Switch checked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Middag (13:00-16:00)</span>
                  <Switch checked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avond (17:00-20:00)</span>
                  <Switch />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Automatische bevestiging</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm">Direct bevestigen</span>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deze Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Beschikbare slots:</span>
                <span className="font-semibold text-green-600">18</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Geboekte slots:</span>
                <span className="font-semibold">4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Bezettingsgraad:</span>
                <span className="font-semibold">22%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
