"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Upload, Download, Eye, Search, Filter } from "lucide-react"

export function DocumentVault() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Kluis</h1>
          <p className="text-muted-foreground">Veilige opslag voor al uw documenten</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Document uploaden
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zoeken en filteren</CardTitle>
          <CardDescription>Vind snel het document dat u zoekt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input placeholder="Zoek op bestandsnaam, type of datum..." />
            </div>
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Zoeken
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recente documenten</CardTitle>
            <CardDescription>Laatst geüploade en bekeken documenten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">Overlijdensakte_JanJansen.pdf</p>
                    <p className="text-sm text-muted-foreground">Familie Jansen • Geüpload op 15 jan 2024</p>
                    <p className="text-xs text-muted-foreground">PDF • 2.3 MB</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium">Identiteitsbewijs_MariePietersen.pdf</p>
                    <p className="text-sm text-muted-foreground">Familie Pietersen • Geüpload op 14 jan 2024</p>
                    <p className="text-xs text-muted-foreground">PDF • 1.8 MB</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="font-medium">Verzekeringspolis_DeWit.pdf</p>
                    <p className="text-sm text-muted-foreground">Familie de Wit • Geüpload op 13 jan 2024</p>
                    <p className="text-xs text-muted-foreground">PDF • 3.1 MB</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="font-medium">Testament_HenkVanDerBerg.pdf</p>
                    <p className="text-sm text-muted-foreground">Familie van der Berg • Geüpload op 12 jan 2024</p>
                    <p className="text-xs text-muted-foreground">PDF • 4.2 MB</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document categorieën</CardTitle>
            <CardDescription>Documenten georganiseerd per type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="font-medium">Overlijdensaktes</p>
                <p className="text-sm text-muted-foreground">12 documenten</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="font-medium">Identiteitsbewijzen</p>
                <p className="text-sm text-muted-foreground">8 documenten</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="font-medium">Verzekeringen</p>
                <p className="text-sm text-muted-foreground">15 documenten</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <p className="font-medium">Testamenten</p>
                <p className="text-sm text-muted-foreground">6 documenten</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
