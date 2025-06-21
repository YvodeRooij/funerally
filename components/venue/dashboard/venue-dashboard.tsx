"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  MapPin,
  Euro,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Settings,
  Phone,
} from "lucide-react"

// Mock data for venue dashboard
const mockVenueData = {
  venue: {
    name: "Westgaarde Crematorium",
    address: "Westgaardeweg 1, Amsterdam",
    capacity: 150,
    type: "Crematorium",
  },
  stats: {
    thisMonth: { bookings: 18, revenue: 7200 },
    occupancyRate: 65,
    avgBookingValue: 400,
    rating: 4.8,
  },
  bookings: [
    {
      id: 1,
      date: "2024-01-18",
      time: "10:00-12:00",
      family: "Familie Van der Berg",
      director: "Jan de Boer",
      attendees: 45,
      value: 450,
      status: "confirmed",
      special: "Livestream gewenst",
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
      special: "Rolstoel toegankelijkheid",
    },
    {
      id: 3,
      date: "2024-01-22",
      time: "11:00-13:00",
      family: "Familie De Vries",
      director: "Ahmed Hassan",
      attendees: 25,
      value: 350,
      status: "confirmed",
      special: "Islamitische ceremonie",
    },
  ],
  requests: [
    {
      id: 4,
      date: "2024-01-25",
      time: "15:00-17:00",
      family: "Familie Bakker",
      director: "Jan de Boer",
      attendees: 60,
      value: 500,
      receivedAt: "2 uur geleden",
      special: "Catering gewenst",
    },
  ],
}

export function VenueDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

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
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">{mockVenueData.venue.name}</h1>
          <p className="text-slate-600 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {mockVenueData.venue.address}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Instellingen
          </Button>
          <Button className="bg-green-700 hover:bg-green-800">
            <Calendar className="h-4 w-4 mr-2" />
            Beschikbaarheid
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Deze maand</p>
                <p className="text-2xl font-bold text-slate-900">{mockVenueData.stats.thisMonth.bookings}</p>
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
                <p className="text-sm text-slate-600">Omzet</p>
                <p className="text-2xl font-bold text-slate-900">
                  €{mockVenueData.stats.thisMonth.revenue.toLocaleString()}
                </p>
                <p className="text-xs text-green-600">↑ +15% vs vorige maand</p>
              </div>
              <Euro className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Bezetting</p>
                <p className="text-2xl font-bold text-slate-900">{mockVenueData.stats.occupancyRate}%</p>
                <p className="text-xs text-green-600">↑ +12% vs vorige maand</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Waardering</p>
                <p className="text-2xl font-bold text-slate-900">{mockVenueData.stats.rating}</p>
                <p className="text-xs text-slate-500">⭐ Gemiddelde score</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="bookings">Boekingen</TabsTrigger>
          <TabsTrigger value="requests">Aanvragen</TabsTrigger>
          <TabsTrigger value="calendar">Kalender</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Upcoming Bookings */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Aankomende boekingen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockVenueData.bookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
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

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{booking.attendees} gasten verwacht</span>
                          <span className="font-medium">€{booking.value}</span>
                        </div>

                        {booking.special && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                            <AlertCircle className="h-4 w-4 inline mr-1" />
                            {booking.special}
                          </div>
                        )}

                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button size="sm" variant="outline">
                            <Phone className="h-3 w-3 mr-1" />
                            Contact
                          </Button>
                          <Button size="sm" variant="outline">
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* New Requests */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Nieuwe aanvragen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mockVenueData.requests.map((request) => (
                    <div key={request.id} className="space-y-3">
                      <div>
                        <p className="font-medium text-blue-800">{request.family}</p>
                        <p className="text-sm text-blue-700">
                          {new Date(request.date).toLocaleDateString("nl-NL")} • {request.time}
                        </p>
                        <p className="text-xs text-blue-600">
                          {request.attendees} gasten • €{request.value}
                        </p>
                        <p className="text-xs text-blue-500">Ontvangen: {request.receivedAt}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Accepteren
                        </Button>
                        <Button size="sm" variant="outline">
                          Afwijzen
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Deze week</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Boekingen</span>
                      <span className="font-semibold">4</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Verwachte omzet</span>
                      <span className="font-semibold">€1.800</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Bezettingsgraad</span>
                      <span className="font-semibold">80%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Availability */}
              <Card>
                <CardHeader>
                  <CardTitle>Beschikbaarheid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Agenda bijwerken
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Clock className="h-4 w-4 mr-2" />
                      Tijdslots instellen
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Voorkeuren
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Alle boekingen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Gedetailleerd boekingsoverzicht komt hier...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Boekingsaanvragen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Aanvragen beheer komt hier...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Kalender overzicht</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Kalender integratie komt hier...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
