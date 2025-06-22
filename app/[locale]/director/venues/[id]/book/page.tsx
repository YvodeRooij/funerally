"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, ArrowLeft, Clock, Users } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function VenueBookingPage() {
  const params = useParams()
  const venueId = params.id

  const [bookingData, setBookingData] = useState({
    date: "",
    time: "",
    duration: "2",
    attendees: "",
    familyName: "",
    deceasedName: "",
    serviceType: "",
    specialRequests: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle booking submission
    console.log("Booking submitted:", bookingData)
    // In production: API call to create booking
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Back Button */}
      <Button variant="outline" asChild className="mb-6">
        <Link href={`/director/venues/${venueId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug naar locatie
        </Link>
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Locatie Boeken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date & Time */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Datum uitvaart</Label>
                    <Input
                      id="date"
                      type="date"
                      value={bookingData.date}
                      onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Tijd</Label>
                    <select
                      id="time"
                      value={bookingData.time}
                      onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      <option value="">Selecteer tijd</option>
                      <option value="09:00">09:00</option>
                      <option value="10:00">10:00</option>
                      <option value="11:00">11:00</option>
                      <option value="13:00">13:00</option>
                      <option value="14:00">14:00</option>
                      <option value="15:00">15:00</option>
                      <option value="16:00">16:00</option>
                    </select>
                  </div>
                </div>

                {/* Duration & Attendees */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duur (uren)</Label>
                    <select
                      id="duration"
                      value={bookingData.duration}
                      onChange={(e) => setBookingData({ ...bookingData, duration: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="1">1 uur</option>
                      <option value="2">2 uur</option>
                      <option value="3">3 uur</option>
                      <option value="4">4 uur</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="attendees">Verwacht aantal gasten</Label>
                    <Input
                      id="attendees"
                      type="number"
                      placeholder="bijv. 80"
                      value={bookingData.attendees}
                      onChange={(e) => setBookingData({ ...bookingData, attendees: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Family Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="familyName">Familie naam</Label>
                    <Input
                      id="familyName"
                      placeholder="bijv. Familie Jansen"
                      value={bookingData.familyName}
                      onChange={(e) => setBookingData({ ...bookingData, familyName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="deceasedName">Naam overledene</Label>
                    <Input
                      id="deceasedName"
                      placeholder="bijv. Jan Jansen"
                      value={bookingData.deceasedName}
                      onChange={(e) => setBookingData({ ...bookingData, deceasedName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Service Type */}
                <div>
                  <Label htmlFor="serviceType">Type dienst</Label>
                  <select
                    id="serviceType"
                    value={bookingData.serviceType}
                    onChange={(e) => setBookingData({ ...bookingData, serviceType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Selecteer type</option>
                    <option value="crematie">Crematie</option>
                    <option value="begrafenis">Begrafenis</option>
                    <option value="afscheidsdienst">Afscheidsdienst</option>
                    <option value="herdenkingsdienst">Herdenkingsdienst</option>
                  </select>
                </div>

                {/* Contact Person */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contactPerson">Contactpersoon</Label>
                    <Input
                      id="contactPerson"
                      placeholder="Uw naam"
                      value={bookingData.contactPerson}
                      onChange={(e) => setBookingData({ ...bookingData, contactPerson: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Telefoon</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="06-12345678"
                      value={bookingData.contactPhone}
                      onChange={(e) => setBookingData({ ...bookingData, contactPhone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">E-mail</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="uw@email.nl"
                      value={bookingData.contactEmail}
                      onChange={(e) => setBookingData({ ...bookingData, contactEmail: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <Label htmlFor="specialRequests">Bijzondere wensen</Label>
                  <Textarea
                    id="specialRequests"
                    placeholder="Eventuele bijzondere wensen of opmerkingen..."
                    value={bookingData.specialRequests}
                    onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Submit */}
                <Button type="submit" className="w-full" size="lg">
                  Boeking Versturen
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Booking Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Boeking Overzicht</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Westgaarde Crematorium</h3>
                <p className="text-sm text-slate-600">Amsterdam • 3.2km</p>
              </div>

              {bookingData.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{bookingData.date}</span>
                </div>
              )}

              {bookingData.time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>
                    {bookingData.time} ({bookingData.duration} uur)
                  </span>
                </div>
              )}

              {bookingData.attendees && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>{bookingData.attendees} gasten</span>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span>Totaal:</span>
                  <span className="text-xl font-bold text-green-600">€1.650</span>
                </div>
                <p className="text-xs text-green-600">Uw speciale tarief</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">
                <p className="font-medium mb-2">Na versturen:</p>
                <ul className="space-y-1">
                  <li>• Bevestiging binnen 1 uur</li>
                  <li>• Direct contact met locatie</li>
                  <li>• Automatisch in uw agenda</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
