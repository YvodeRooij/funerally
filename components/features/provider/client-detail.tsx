"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Phone, Mail, MapPin, Calendar, FileText, MessageSquare } from "lucide-react"

export function ClientDetail() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Familie Jansen</h1>
          <p className="text-muted-foreground">Klant details en geschiedenis</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Bericht sturen
          </Button>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Afspraak plannen
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Contactgegevens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Marie en Piet Jansen</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">06-12345678</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">marie@jansen.nl</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Hoofdstraat 123, Amsterdam</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Klant sinds</span>
              <span className="text-sm font-medium">15 jan 2024</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              <Badge className="bg-green-100 text-green-800">Actief</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Laatste contact</span>
              <span className="text-sm font-medium">Vandaag</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Samenvatting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Afspraken</span>
              <span className="text-sm font-medium">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Documenten</span>
              <span className="text-sm font-medium">8</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Berichten</span>
              <span className="text-sm font-medium">12</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Tijdlijn</TabsTrigger>
          <TabsTrigger value="documents">Documenten</TabsTrigger>
          <TabsTrigger value="appointments">Afspraken</TabsTrigger>
          <TabsTrigger value="notes">Notities</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Activiteiten tijdlijn</CardTitle>
              <CardDescription>Chronologisch overzicht van alle activiteiten</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Documenten geüpload</p>
                    <p className="text-xs text-muted-foreground">Overlijdensakte en identiteitsbewijs ontvangen</p>
                    <p className="text-xs text-muted-foreground">Vandaag, 14:30</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Afspraak bevestigd</p>
                    <p className="text-xs text-muted-foreground">Gesprek gepland voor 24 januari</p>
                    <p className="text-xs text-muted-foreground">Gisteren, 16:45</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Eerste contact</p>
                    <p className="text-xs text-muted-foreground">Telefonisch intake gesprek gevoerd</p>
                    <p className="text-xs text-muted-foreground">15 jan, 10:00</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Documenten
              </CardTitle>
              <CardDescription>Alle documenten van deze klant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Overlijdensakte.pdf</p>
                      <p className="text-xs text-muted-foreground">Geüpload vandaag</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Bekijk
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Identiteitsbewijs.pdf</p>
                      <p className="text-xs text-muted-foreground">Geüpload vandaag</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Bekijk
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Afspraken
              </CardTitle>
              <CardDescription>Geplande en voltooide afspraken</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="text-sm font-medium">Woensdag 24 januari, 14:00</p>
                    <p className="text-xs text-muted-foreground">Voorbereiding uitvaart</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Gepland</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="text-sm font-medium">Maandag 15 januari, 10:00</p>
                    <p className="text-xs text-muted-foreground">Eerste gesprek</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Voltooid</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Persoonlijke notities</CardTitle>
              <CardDescription>Uw aantekeningen over deze klant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded">
                  <p className="text-sm">
                    Familie heeft specifieke wensen voor de muziek tijdens de dienst. Klassieke muziek heeft de
                    voorkeur.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">15 jan 2024</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-sm">
                    Overledene was actief in de lokale kerk. Contact opnemen met dominee voor mogelijke medewerking.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">16 jan 2024</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
