"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Upload, Download, Eye } from "lucide-react"

export function FamilyDocuments() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documenten</h1>
          <p className="text-muted-foreground">Beheer uw documenten veilig en eenvoudig</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Document uploaden
        </Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Geüploade documenten</CardTitle>
            <CardDescription>Uw documenten worden veilig bewaard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">Overlijdensakte.pdf</p>
                    <p className="text-sm text-muted-foreground">Geüpload op 15 jan 2024</p>
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
                    <p className="font-medium">Identiteitsbewijs.pdf</p>
                    <p className="text-sm text-muted-foreground">Geüpload op 14 jan 2024</p>
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
                    <p className="font-medium">Verzekeringspolis.pdf</p>
                    <p className="text-sm text-muted-foreground">Geüpload op 13 jan 2024</p>
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
            <CardTitle>Document upload</CardTitle>
            <CardDescription>Sleep bestanden hierheen of klik om te uploaden</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Sleep bestanden hierheen</p>
              <p className="text-muted-foreground mb-4">of klik om bestanden te selecteren</p>
              <Button>Bestanden selecteren</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
