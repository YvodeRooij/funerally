"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Plus } from "lucide-react"

export function DirectorCalendar() {
  const appointments = [
    {
      id: 1,
      time: "09:00",
      title: "Familie gesprek - Van der Berg",
      type: "meeting",
      location: "Kantoor",
      duration: "1 uur",
    },
    {
      id: 2,
      time: "14:00",
      title: "Uitvaart - Maria Jansen",
      type: "service",
      location: "Westgaarde Crematorium",
      duration: "2 uur",
    },
    {
      id: 3,
      time: "16:30",
      title: "Locatie bezichtiging",
      type: "appointment",
      location: "Nieuwe Ooster",
      duration: "30 min",
    },
  ]

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Calendar View */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Woensdag 15 januari 2025
              </CardTitle>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Afspraak Toevoegen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-slate-50 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{appointment.time}</span>
                        <Badge
                          variant="secondary"
                          className={
                            appointment.type === "service"
                              ? "bg-purple-100 text-purple-800"
                              : appointment.type === "meeting"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                          }
                        >
                          {appointment.type === "service"
                            ? "Uitvaart"
                            : appointment.type === "meeting"
                              ? "Gesprek"
                              : "Afspraak"}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-slate-900">{appointment.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {appointment.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {appointment.duration}
                        </div>
                      </div>
                    </div>
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
        <Card>
          <CardHeader>
            <CardTitle>Deze Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Uitvaarten:</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Familie gesprekken:</span>
                <span className="font-semibold">5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Vrije tijd:</span>
                <span className="font-semibold text-green-600">12 uur</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aankomende Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="font-medium text-red-800">Begraafsvergunning</p>
                <p className="text-sm text-red-600">Familie Jansen - morgen</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="font-medium text-yellow-800">Bloemen bestellen</p>
                <p className="text-sm text-yellow-600">Familie Van der Berg - 2 dagen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
