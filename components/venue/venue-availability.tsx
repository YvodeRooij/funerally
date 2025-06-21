"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  FolderSyncIcon as Sync,
  Smartphone,
} from "lucide-react"

// Mock availability data
const mockTimeSlots = [
  {
    id: 1,
    day: "Maandag",
    slots: [
      { start: "09:00", end: "12:00", available: true, price: 300 },
      { start: "14:00", end: "17:00", available: true, price: 400 },
      { start: "19:00", end: "22:00", available: false, price: 350 },
    ],
  },
  {
    id: 2,
    day: "Dinsdag",
    slots: [
      { start: "09:00", end: "12:00", available: true, price: 300 },
      { start: "14:00", end: "17:00", available: true, price: 400 },
    ],
  },
  {
    id: 3,
    day: "Woensdag",
    slots: [
      { start: "09:00", end: "12:00", available: true, price: 300 },
      { start: "14:00", end: "17:00", available: true, price: 400 },
      { start: "19:00", end: "22:00", available: true, price: 350 },
    ],
  },
  {
    id: 4,
    day: "Donderdag",
    slots: [
      { start: "09:00", end: "12:00", available: true, price: 300 },
      { start: "14:00", end: "17:00", available: true, price: 400 },
    ],
  },
  {
    id: 5,
    day: "Vrijdag",
    slots: [
      { start: "09:00", end: "12:00", available: true, price: 300 },
      { start: "14:00", end: "17:00", available: true, price: 400 },
      { start: "19:00", end: "22:00", available: true, price: 350 },
    ],
  },
  {
    id: 6,
    day: "Zaterdag",
    slots: [
      { start: "10:00", end: "13:00", available: true, price: 500 },
      { start: "15:00", end: "18:00", available: true, price: 600 },
    ],
  },
  { id: 7, day: "Zondag", slots: [{ start: "14:00", end: "17:00", available: false, price: 450 }] },
]

const mockBookings = [
  {
    id: 1,
    date: "2024-01-20",
    time: "14:00-16:00",
    family: "Familie van der Berg",
    director: "Jan de Boer",
    status: "confirmed",
    attendees: 45,
    value: 450,
    special: "Livestream gewenst",
  },
  {
    id: 2,
    date: "2024-01-22",
    time: "11:00-13:00",
    family: "Familie Bakker",
    director: "Maria Visser",
    status: "pending",
    attendees: 80,
    value: 600,
    special: "Catering voor 80 personen",
  },
  {
    id: 3,
    date: "2024-01-25",
    time: "15:00-17:00",
    family: "Familie de Vries",
    director: "Ahmed Hassan",
    status: "confirmed",
    attendees: 25,
    value: 350,
    special: "Islamitische ceremonie",
  },
]

const mockBlackoutDates = [
  { date: "2024-01-01", reason: "Nieuwjaarsdag" },
  { date: "2024-04-27", reason: "Koningsdag" },
  { date: "2024-12-25", reason: "Kerstmis" },
  { date: "2024-12-26", reason: "Tweede Kerstdag" },
]

export function VenueAvailability() {
  const [activeTab, setActiveTab] = useState("schedule")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Beschikbaarheid beheer</h1>
          <p className="text-slate-600">Beheer uw tijdslots, prijzen en boekingen</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Sync className="h-4 w-4 mr-2" />
            Agenda sync
          </Button>
          <Button variant="outline">
            <Smartphone className="h-4 w-4 mr-2" />
            WhatsApp Bot
          </Button>
          <Button className="bg-green-700 hover:bg-green-800">
            <Plus className="h-4 w-4 mr-2" />
            Tijdslot toevoegen
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Deze week</p>
                <p className="text-2xl font-bold text-slate-900">4</p>
                <p className="text-xs text-slate-500">boekingen</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Bezettingsgraad</p>
                <p className="text-2xl font-bold text-slate-900">68%</p>
                <p className="text-xs text-green-600">↑ +12% vs vorige week</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Wachtende aanvragen</p>
                <p className="text-2xl font-bold text-slate-900">2</p>
                <p className="text-xs text-yellow-600">Reactie vereist</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Week omzet</p>
                <p className="text-2xl font-bold text-slate-900">€1.800</p>
                <p className="text-xs text-green-600">↑ +8% vs vorige week</p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="schedule">Weekschema</TabsTrigger>
          <TabsTrigger value="bookings">Boekingen</TabsTrigger>
          <TabsTrigger value="pricing">Prijzen</TabsTrigger>
          <TabsTrigger value="blackout">Gesloten dagen</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Wekelijks schema
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? "Opslaan" : "Bewerken"}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Tijdslot toevoegen
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockTimeSlots.map((day) => (
                  <div key={day.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-slate-900 mb-4">{day.day}</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {day.slots.map((slot, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 ${
                            slot.available ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-900">
                              {slot.start} - {slot.end}
                            </span>
                            {slot.available ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">€{slot.price}</span>
                            <Badge
                              className={slot.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                            >
                              {slot.available ? "Beschikbaar" : "Gesloten"}
                            </Badge>
                          </div>
                          {isEditing && (
                            <div className="flex gap-1 mt-3">
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Aankomende boekingen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{booking.family}</h3>
                        <p className="text-sm text-slate-600">
                          {new Date(booking.date).toLocaleDateString("nl-NL")} • {booking.time}
                        </p>
                        <p className="text-xs text-slate-500">Uitvaartondernemer: {booking.director}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(booking.status)}
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status === "confirmed" ? "Bevestigd" : "In afwachting"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Gasten:</span>
                        <span className="ml-1 font-medium">{booking.attendees}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Waarde:</span>
                        <span className="ml-1 font-medium">€{booking.value}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Status:</span>
                        <span className="ml-1 font-medium">
                          {booking.status === "confirmed" ? "Bevestigd" : "Wachtend"}
                        </span>
                      </div>
                    </div>

                    {booking.special && (
                      <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        {booking.special}
                      </div>
                    )}

                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      {booking.status === "pending" && (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Accepteren
                          </Button>
                          <Button size="sm" variant="outline">
                            Afwijzen
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline">
                        Details bekijken
                      </Button>
                      <Button size="sm" variant="outline">
                        Contact opnemen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dynamische prijzen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-base">Basis weekdag prijs</Label>
                    <div className="flex items-center mt-2">
                      <span className="bg-slate-100 border border-r-0 border-slate-300 px-3 py-2 rounded-l-lg text-slate-600">
                        €
                      </span>
                      <Input defaultValue="400" className="rounded-l-none" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-base">Weekend toeslag (%)</Label>
                    <div className="flex items-center mt-2">
                      <Input defaultValue="25" className="rounded-r-none" />
                      <span className="bg-slate-100 border border-l-0 border-slate-300 px-3 py-2 rounded-r-lg text-slate-600">
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base">Avond toeslag (%)</Label>
                    <div className="flex items-center mt-2">
                      <Input defaultValue="15" className="rounded-r-none" />
                      <span className="bg-slate-100 border border-l-0 border-slate-300 px-3 py-2 rounded-r-lg text-slate-600">
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base">Last-minute korting (%)</Label>
                    <div className="flex items-center mt-2">
                      <Input defaultValue="10" className="rounded-r-none" />
                      <span className="bg-slate-100 border border-l-0 border-slate-300 px-3 py-2 rounded-r-lg text-slate-600">
                        %
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Voor boekingen binnen 24 uur</p>
                  </div>

                  <Button className="w-full">Prijzen bijwerken</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seizoensprijzen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Zomerperiode</h4>
                      <Badge className="bg-orange-100 text-orange-800">+20%</Badge>
                    </div>
                    <p className="text-sm text-slate-600">1 juni - 31 augustus</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Kerst/Nieuwjaar</h4>
                      <Badge className="bg-red-100 text-red-800">+35%</Badge>
                    </div>
                    <p className="text-sm text-slate-600">20 december - 5 januari</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Lente</h4>
                      <Badge className="bg-green-100 text-green-800">+10%</Badge>
                    </div>
                    <p className="text-sm text-slate-600">1 maart - 31 mei</p>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Seizoen toevoegen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blackout">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Gesloten dagen</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Datum toevoegen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockBlackoutDates.map((blackout, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        {new Date(blackout.date).toLocaleDateString("nl-NL")}
                      </p>
                      <p className="text-sm text-slate-600">{blackout.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
