"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, Phone, CheckCircle, XCircle, Clock } from "lucide-react"

export function VenueBookingManager() {
  const bookings = [
    {
      id: 1,
      date: "2024-01-18",
      time: "10:00-12:00",
      family: "Familie Van der Berg",
      director: "Jan de Boer",
      attendees: 45,
      value: 450,
      status: "confirmed",
      receivedAt: "3 dagen geleden",
    },
    {
      id: 2,
      date: "2024-01-20",
      time: "14:00-16:00",
      family: "Familie Jansen",
      director: "Maria Visser",
      attendees: 80,
      value: 600,
      status: "pending",
      receivedAt: "2 uur geleden",
    },
  ]

  return (
    <Tabs defaultValue="pending" className="space-y-6">
      <TabsList>
        <TabsTrigger value="pending">Nieuwe Aanvragen</TabsTrigger>
        <TabsTrigger value="confirmed">Bevestigd</TabsTrigger>
        <TabsTrigger value="completed">Afgerond</TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        <div className="space-y-4">
          {bookings
            .filter((b) => b.status === "pending")
            .map((booking) => (
              <Card key={booking.id} className="border-blue-200 bg-blue-50/30">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{booking.family}</h3>
                      <p className="text-slate-600">Uitvaartondernemer: {booking.director}</p>
                      <p className="text-sm text-slate-500">
                        {booking.date} • {booking.time}
                      </p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Nieuw
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-slate-400" />
                      <span>{booking.attendees} gasten</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">€{booking.value}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Ontvangen: {booking.receivedAt}</span>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accepteren
                      </Button>
                      <Button size="sm" variant="outline">
                        <XCircle className="h-3 w-3 mr-1" />
                        Afwijzen
                      </Button>
                      <Button size="sm" variant="outline">
                        <Phone className="h-3 w-3 mr-1" />
                        Bellen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </TabsContent>

      <TabsContent value="confirmed">
        <div className="space-y-4">
          {bookings
            .filter((b) => b.status === "confirmed")
            .map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{booking.family}</h3>
                      <p className="text-slate-600">Uitvaartondernemer: {booking.director}</p>
                      <p className="text-sm text-slate-500">
                        {booking.date} • {booking.time}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Bevestigd
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-slate-400" />
                      <span>{booking.attendees} gasten</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">€{booking.value}</span>
                    </div>
                    <div className="text-right">
                      <Button size="sm" variant="outline">
                        <Phone className="h-3 w-3 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </TabsContent>

      <TabsContent value="completed">
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Afgeronde Boekingen</h3>
            <p className="text-slate-500">Hier vindt u alle succesvol afgeronde boekingen</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
