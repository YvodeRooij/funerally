"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, List, Filter } from "lucide-react"
import Link from "next/link"

export default function VenueMapPage() {
  const [viewMode, setViewMode] = useState<"map" | "list">("map")

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Locaties Kaart</h1>
          <p className="text-slate-600">Geografisch overzicht van beschikbare locaties</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/director/venues">
              <List className="h-4 w-4 mr-2" />
              Lijst Weergave
            </Link>
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <Card className="h-[600px]">
        <CardContent className="p-0 h-full">
          <div className="h-full bg-slate-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Google Maps Integratie</h3>
              <p className="text-slate-500 mb-4">Interactieve kaart met alle locaties in uw werkgebied</p>
              <Badge variant="secondary">Google Maps API Required</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-slate-600">Binnen 10km</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">8</div>
            <div className="text-sm text-slate-600">Beschikbaar</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">5</div>
            <div className="text-sm text-slate-600">Favorieten</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">15m</div>
            <div className="text-sm text-slate-600">Gem. reistijd</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
