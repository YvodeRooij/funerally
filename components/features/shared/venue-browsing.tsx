"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, Star, Users } from "lucide-react"

export function VenueBrowsing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Locaties zoeken</h1>
        <p className="text-muted-foreground">Vind de perfecte locatie voor uw uitvaart</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zoekfilters</CardTitle>
          <CardDescription>Verfijn uw zoekopdracht</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input placeholder="Zoek op locatie, naam of postcode..." />
            </div>
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Zoeken
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Uitvaartcentrum De Roos</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  Amsterdam, Noord-Holland
                </CardDescription>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="text-sm">4.8</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Capaciteit</span>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="text-sm">150 personen</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">Parkeren</Badge>
                <Badge variant="secondary">Toegankelijk</Badge>
                <Badge variant="secondary">Catering</Badge>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-lg font-bold">€350</span>
                  <span className="text-sm text-muted-foreground">/dag</span>
                </div>
                <Button size="sm">Bekijk details</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Aula Het Licht</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  Utrecht, Utrecht
                </CardDescription>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="text-sm">4.6</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Capaciteit</span>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="text-sm">80 personen</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">Muziekinstallatie</Badge>
                <Badge variant="secondary">Beamer</Badge>
                <Badge variant="secondary">Stille ruimte</Badge>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-lg font-bold">€275</span>
                  <span className="text-sm text-muted-foreground">/dag</span>
                </div>
                <Button size="sm">Bekijk details</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Crematorium Westerveld</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  Driehuis, Noord-Holland
                </CardDescription>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="text-sm">4.9</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Capaciteit</span>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="text-sm">200 personen</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">Crematie</Badge>
                <Badge variant="secondary">Condoleance</Badge>
                <Badge variant="secondary">Tuin</Badge>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-lg font-bold">€450</span>
                  <span className="text-sm text-muted-foreground">/dag</span>
                </div>
                <Button size="sm">Bekijk details</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
