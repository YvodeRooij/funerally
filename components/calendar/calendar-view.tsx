"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, AlertCircle, CheckCircle } from "lucide-react"

// Mock calendar data
const mockEvents = [
  {
    id: 1,
    title: "Uitvaart Henk van der Berg",
    type: "funeral",
    date: "2024-01-20",
    time: "14:00-16:00",
    location: "Westgaarde Crematorium",
    attendees: 45,
    status: "confirmed",
    director: "Jan de Boer",
    family: "Familie van der Berg",
  },
  {
    id: 2,
    title: "Intake gesprek Familie Jansen",
    type: "meeting",
    date: "2024-01-18",
    time: "10:00-11:00",
    location: "Kantoor",
    attendees: 3,
    status: "confirmed",
    director: "Jan de Boer",
    family: "Familie Jansen",
  },
  {
    id: 3,
    title: "Condoleance bezoek",
    type: "visit",
    date: "2024-01-19",
    time: "15:00-16:00",
    location: "Thuis familie",
    attendees: 2,
    status: "pending",
    director: "Jan de Boer",
    family: "Familie de Vries",
  },
  {
    id: 4,
    title: "Uitvaart Maria Bakker",
    type: "funeral",
    date: "2024-01-22",
    time: "11:00-13:00",
    location: "Protestantse Kerk",
    attendees: 80,
    status: "confirmed",
    director: "Maria Visser",
    family: "Familie Bakker",
  },
]

const daysInMonth = 31
const firstDayOfMonth = 1 // Monday = 1, Sunday = 0
const today = 15

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 15)) // January 15, 2024
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")

  const monthNames = [
    "Januari",
    "Februari",
    "Maart",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Augustus",
    "September",
    "Oktober",
    "November",
    "December",
  ]

  const dayNames = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"]

  const getEventsForDate = (date: number) => {
    const dateStr = `2024-01-${date.toString().padStart(2, "0")}`
    return mockEvents.filter((event) => event.date === dateStr)
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "funeral":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "meeting":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "visit":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case "pending":
        return <AlertCircle className="h-3 w-3 text-yellow-600" />
      default:
        return null
    }
  }

  const renderCalendarDays = () => {
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const events = getEventsForDate(day)
      const isToday = day === today
      const isSelected = day === selectedDate

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(day)}
          className={`h-24 p-2 border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors ${
            isToday ? "bg-blue-50 border-blue-300" : ""
          } ${isSelected ? "bg-purple-50 border-purple-300" : ""}`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : "text-slate-900"}`}>{day}</div>
          <div className="space-y-1">
            {events.slice(0, 2).map((event) => (
              <div key={event.id} className={`text-xs p-1 rounded border ${getEventTypeColor(event.type)} truncate`}>
                {event.time.split("-")[0]} {event.title}
              </div>
            ))}
            {events.length > 2 && <div className="text-xs text-slate-500">+{events.length - 2} meer</div>}
          </div>
        </div>,
      )
    }

    return days
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Agenda</h1>
          <p className="text-slate-600">Overzicht van alle afspraken en uitvaarten</p>
        </div>
        <div className="flex gap-3">
          <div className="flex border border-slate-300 rounded-lg">
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("month")}
              className="rounded-r-none"
            >
              Maand
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("week")}
              className="rounded-none border-x"
            >
              Week
            </Button>
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("day")}
              className="rounded-l-none"
            >
              Dag
            </Button>
          </div>
          <Button className="bg-purple-700 hover:bg-purple-800">
            <Plus className="h-4 w-4 mr-2" />
            Afspraak maken
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    Vandaag
                  </Button>
                  <Button size="sm" variant="outline">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-0 mb-2">
                {dayNames.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-slate-600 border-b">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0">{renderCalendarDays()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vandaag</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockEvents
                  .filter((event) => event.date === "2024-01-15")
                  .map((event) => (
                    <div key={event.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-slate-900 text-sm">{event.title}</h4>
                        {getStatusIcon(event.status)}
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.attendees} personen
                        </div>
                      </div>
                    </div>
                  ))}
                {mockEvents.filter((event) => event.date === "2024-01-15").length === 0 && (
                  <p className="text-slate-500 text-sm">Geen afspraken vandaag</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Events */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate} {monthNames[currentDate.getMonth()]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-slate-900 text-sm">{event.title}</h4>
                        <Badge className={getEventTypeColor(event.type)}>
                          {event.type === "funeral" ? "Uitvaart" : event.type === "meeting" ? "Gesprek" : "Bezoek"}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.attendees} personen
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedDateEvents.length === 0 && (
                    <p className="text-slate-500 text-sm">Geen afspraken op deze datum</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deze maand</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Uitvaarten</span>
                  <span className="font-semibold">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Gesprekken</span>
                  <span className="font-semibold">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Bezoeken</span>
                  <span className="font-semibold">2</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
