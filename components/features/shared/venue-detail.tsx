"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Star, Users, Clock, Euro, Phone, Mail, Calendar } from "lucide-react"

export function VenueDetail() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Uitvaartcentrum De Roos</h1>
          <p className="text-muted-foreground flex items-center mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            Amsterdam, Noord-Holland
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Phone className="mr-2 h-4 w-4" />
            Bellen
          </Button>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Boeken
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Beoordeling</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="font-bold">4.8</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Gebaseerd op 24 beoordelingen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Capaciteit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">150</p>
            <p className="text-sm text-muted-foreground">personen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Euro className="mr-2 h-5 w-5" />
              Prijs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">€350</p>
            <p className="text-sm text-muted-foreground">per dag</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="amenities">Voorzieningen</TabsTrigger>
          <TabsTrigger value="availability">Beschikbaarheid</TabsTrigger>
          <TabsTrigger value="reviews">Beoordelingen</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Over deze locatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Uitvaartcentrum De Roos is een moderne en serene locatie in het hart van Amsterdam. Met ruime
                faciliteiten en een warme, respectvolle sfeer bieden wij families de perfecte omgeving om afscheid te
                nemen van hun dierbaren.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Contactgegevens</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>020-1234567</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>info@deroos.nl</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Hoofdstraat 123, 1000 AB Amsterdam</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Openingstijden</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Maandag - Vrijdag</span>
                      <span>09:00 - 17:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Zaterdag</span>
                      <span>10:00 - 16:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Zondag</span>
                      <span>Gesloten</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amenities">
          <Card>
            <CardHeader>
              <CardTitle>Voorzieningen</CardTitle>
              <CardDescription>Alle faciliteiten die deze locatie biedt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Badge variant="secondary" className="justify-center p-2">
                  Parkeren
                </Badge>
                <Badge variant="secondary" className="justify-center p-2">
                  Toegankelijk
                </Badge>
                <Badge variant="secondary" className="justify-center p-2">
                  Catering
                </Badge>
                <Badge variant="secondary" className="justify-center p-2">
                  Muziekinstallatie
                </Badge>
                <Badge variant="secondary" className="justify-center p-2">
                  Beamer
                </Badge>
                <Badge variant="secondary" className="justify-center p-2">
                  Stille ruimte
                </Badge>
                <Badge variant="secondary" className="justify-center p-2">
                  Tuin
                </Badge>
                <Badge variant="secondary" className="justify-center p-2">
                  Koffiekamer
                </Badge>
                <Badge variant="secondary" className="justify-center p-2">
                  WiFi
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Beschikbaarheid
              </CardTitle>
              <CardDescription>Bekijk wanneer deze locatie beschikbaar is</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2 text-center">
                  <div className="text-sm font-medium text-muted-foreground">Ma</div>
                  <div className="text-sm font-medium text-muted-foreground">Di</div>
                  <div className="text-sm font-medium text-muted-foreground">Wo</div>
                  <div className="text-sm font-medium text-muted-foreground">Do</div>
                  <div className="text-sm font-medium text-muted-foreground">Vr</div>
                  <div className="text-sm font-medium text-muted-foreground">Za</div>
                  <div className="text-sm font-medium text-muted-foreground">Zo</div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 14 }, (_, i) => (
                    <div
                      key={i}
                      className={`aspect-square p-2 text-center text-sm border rounded ${
                        i === 3 || i === 8
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800 cursor-pointer hover:bg-green-200"
                      }`}
                    >
                      {i + 22}
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span>Beschikbaar</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                    <span>Bezet</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5" />
                Beoordelingen
              </CardTitle>
              <CardDescription>Wat anderen zeggen over deze locatie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Familie Jansen</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">2 weken geleden</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "Een prachtige locatie met veel aandacht voor detail. Het personeel was zeer behulpzaam en de
                    faciliteiten waren uitstekend. Een waardige plek om afscheid te nemen."
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Familie de Wit</span>
                      <div className="flex">
                        {[1, 2, 3, 4].map((star) => (
                          <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                        <Star className="h-4 w-4 text-gray-300" />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">1 maand geleden</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "Mooie locatie met goede voorzieningen. Parkeren was soms wat lastig, maar verder een zeer geschikte
                    plek voor een uitvaartdienst."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
