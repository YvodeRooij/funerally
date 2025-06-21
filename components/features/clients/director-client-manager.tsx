"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Search, Plus, Phone, Mail, Calendar } from "lucide-react"

export function DirectorClientManager() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Klanten</h1>
          <p className="text-muted-foreground">Beheer uw klantrelaties</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe klant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zoeken en filteren</CardTitle>
          <CardDescription>Vind snel de klant die u zoekt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input placeholder="Zoek op naam, telefoon of e-mail..." />
            </div>
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Zoeken
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Familie Jansen</CardTitle>
                <CardDescription>Marie en Piet Jansen</CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800">Actief</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>06-12345678</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>marie@jansen.nl</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Volgende afspraak: 24 jan</span>
              </div>
              <div className="flex space-x-2 pt-2">
                <Button size="sm" variant="outline">
                  Bekijk
                </Button>
                <Button size="sm">Contact</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Familie de Wit</CardTitle>
                <CardDescription>Jan en Els de Wit</CardDescription>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Nazorg</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>06-87654321</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>jan@dewit.nl</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Laatste contact: 15 jan</span>
              </div>
              <div className="flex space-x-2 pt-2">
                <Button size="sm" variant="outline">
                  Bekijk
                </Button>
                <Button size="sm">Contact</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Familie Pietersen</CardTitle>
                <CardDescription>Anna Pietersen</CardDescription>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">Nieuw</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>06-11223344</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>anna@pietersen.nl</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Eerste contact: 20 jan</span>
              </div>
              <div className="flex space-x-2 pt-2">
                <Button size="sm" variant="outline">
                  Bekijk
                </Button>
                <Button size="sm">Contact</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Recente activiteit
          </CardTitle>
          <CardDescription>Laatste updates van uw klanten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Familie Jansen heeft nieuwe documenten geüpload</p>
                <p className="text-xs text-muted-foreground">2 uur geleden</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Afspraak bevestigd met Familie de Wit</p>
                <p className="text-xs text-muted-foreground">4 uur geleden</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nieuwe klant toegevoegd: Familie Pietersen</p>
                <p className="text-xs text-muted-foreground">1 dag geleden</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
