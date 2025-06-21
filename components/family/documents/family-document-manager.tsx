"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, AlertCircle, Download } from "lucide-react"

export function FamilyDocumentManager() {
  const documents = [
    { name: "Overlijdensakte", status: "uploaded", required: true, uploadDate: "2024-01-10" },
    { name: "Crematievergunning", status: "pending", required: true, uploadDate: null },
    { name: "Verzekeringspolis", status: "uploaded", required: false, uploadDate: "2024-01-11" },
    { name: "Foto's voor herdenking", status: "missing", required: false, uploadDate: null },
  ]

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-blue-300 bg-blue-50/30">
        <CardContent className="p-8 text-center">
          <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Document uploaden</h3>
          <p className="text-slate-600 mb-4">Sleep bestanden hier of klik om te selecteren</p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Upload className="h-4 w-4 mr-2" />
            Bestanden Selecteren
          </Button>
        </CardContent>
      </Card>

      {/* Document List */}
      <div className="space-y-4">
        {documents.map((doc, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{doc.name}</h3>
                    <p className="text-sm text-slate-500">
                      {doc.required ? "Verplicht document" : "Optioneel document"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      doc.status === "uploaded"
                        ? "bg-green-100 text-green-800"
                        : doc.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }
                  >
                    {doc.status === "uploaded" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {doc.status === "pending" && <AlertCircle className="h-3 w-3 mr-1" />}
                    {doc.status === "missing" && <AlertCircle className="h-3 w-3 mr-1" />}
                    {doc.status === "uploaded" ? "Geüpload" : doc.status === "pending" ? "In behandeling" : "Ontbreekt"}
                  </Badge>
                  {doc.status === "uploaded" && (
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                  {doc.status === "missing" && (
                    <Button size="sm">
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
