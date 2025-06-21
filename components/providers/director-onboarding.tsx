"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  CheckCircle,
  Camera,
  Smartphone,
  Zap,
  Building,
  Shield,
  Award,
  CreditCard,
  ArrowRight,
  Sparkles,
  Clock,
  AlertCircle,
} from "lucide-react"

interface ExtractedData {
  companyName?: string
  kvkNumber?: string
  address?: string
  city?: string
  postalCode?: string
  phone?: string
  email?: string
  website?: string
  services?: string[]
  certifications?: string[]
  insuranceProvider?: string
  contactPerson?: string
}

interface DocumentUpload {
  id: string
  name: string
  type: string
  status: "uploading" | "processing" | "completed" | "error"
  extractedData?: ExtractedData
  confidence?: number
}

const quickDocuments = [
  {
    id: "kvk-extract",
    name: "KvK Uittreksel",
    description: "Vult automatisch bedrijfsgegevens in",
    icon: Building,
    priority: 1,
    extractsFields: ["companyName", "kvkNumber", "address", "city", "postalCode", "contactPerson"],
    tips: "Recent uittreksel (max 3 maanden oud)",
  },
  {
    id: "insurance-cert",
    name: "Verzekeringscertificaat",
    description: "Beroepsaansprakelijkheid bewijs",
    icon: Shield,
    priority: 2,
    extractsFields: ["insuranceProvider", "coverageAmount"],
    tips: "Geldig certificaat van beroepsaansprakelijkheidsverzekering",
  },
  {
    id: "business-card",
    name: "Visitekaartje/Brochure",
    description: "Contact en service informatie",
    icon: CreditCard,
    priority: 3,
    extractsFields: ["phone", "email", "website", "services"],
    tips: "Foto van visitekaartje of scan van brochure",
  },
  {
    id: "certificates",
    name: "Diploma's/Certificaten",
    description: "Kwalificaties en specialisaties",
    icon: Award,
    priority: 4,
    extractsFields: ["certifications", "specializations"],
    tips: "Uitvaartondernemer diploma, cursuscertificaten",
  },
]

export function DirectorOnboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [uploads, setUploads] = useState<DocumentUpload[]>([])
  const [extractedData, setExtractedData] = useState<ExtractedData>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)

  const steps = [
    { id: "documents", title: "📄 Documenten Uploaden", description: "Laat ons het werk doen" },
    { id: "review", title: "✅ Gegevens Controleren", description: "Controleer en aanvullen" },
    { id: "complete", title: "🎉 Klaar!", description: "Account activeren" },
  ]

  // Simulate AI data extraction
  const simulateDataExtraction = async (file: File, documentType: string): Promise<ExtractedData> => {
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock extracted data based on document type
    switch (documentType) {
      case "kvk-extract":
        return {
          companyName: "Uitvaartzorg De Boer B.V.",
          kvkNumber: "12345678",
          address: "Hoofdstraat 123",
          city: "Amsterdam",
          postalCode: "1012 AB",
          contactPerson: "Jan de Boer",
        }
      case "insurance-cert":
        return {
          insuranceProvider: "DELA Verzekeringen",
        }
      case "business-card":
        return {
          phone: "020-1234567",
          email: "info@deboer-uitvaart.nl",
          website: "www.deboer-uitvaart.nl",
          services: ["Begrafenis", "Crematie", "Uitvaart thuis"],
        }
      case "certificates":
        return {
          certifications: ["Uitvaartondernemer Diploma", "DELA Certificering"],
        }
      default:
        return {}
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[], documentType: string) => {
    const file = acceptedFiles[0]
    if (!file) return

    const newUpload: DocumentUpload = {
      id: Date.now().toString(),
      name: file.name,
      type: documentType,
      status: "uploading",
    }

    setUploads((prev) => [...prev, newUpload])
    setIsProcessing(true)

    // Simulate upload
    setTimeout(() => {
      setUploads((prev) =>
        prev.map((upload) => (upload.id === newUpload.id ? { ...upload, status: "processing" } : upload)),
      )
    }, 500)

    // Simulate AI extraction
    try {
      const extracted = await simulateDataExtraction(file, documentType)

      setUploads((prev) =>
        prev.map((upload) =>
          upload.id === newUpload.id
            ? { ...upload, status: "completed", extractedData: extracted, confidence: 95 }
            : upload,
        ),
      )

      // Merge extracted data
      setExtractedData((prev) => ({ ...prev, ...extracted }))
    } catch (error) {
      setUploads((prev) => prev.map((upload) => (upload.id === newUpload.id ? { ...upload, status: "error" } : upload)))
    }

    setIsProcessing(false)
  }, [])

  const completedUploads = uploads.filter((u) => u.status === "completed").length
  const totalPriorityDocs = quickDocuments.filter((d) => d.priority <= 2).length
  const canProceed = completedUploads >= 1 || showManualForm

  const progress =
    currentStep === 0
      ? Math.min((completedUploads / totalPriorityDocs) * 100, 100)
      : ((currentStep + 1) / steps.length) * 100

  if (currentStep === 0) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-serif font-bold text-slate-900">Snelle Aanmelding</h1>
          </div>
          <p className="text-lg text-slate-600 mb-2">Upload uw documenten en wij vullen alles automatisch in</p>
          <div className="flex items-center justify-center gap-2 text-sm text-green-700">
            <Clock className="h-4 w-4" />
            <span>Gemiddeld 3 minuten • 95% automatisch ingevuld</span>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Stap 1: Documenten uploaden</h2>
              <Badge className="bg-blue-100 text-blue-800">
                {completedUploads}/{totalPriorityDocs} verplicht
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-slate-600 mt-2">Upload minimaal uw KvK uittreksel om door te gaan</p>
          </CardContent>
        </Card>

        {/* Quick Upload Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {quickDocuments.map((doc) => (
            <DocumentUploadCard
              key={doc.id}
              document={doc}
              upload={uploads.find((u) => u.type === doc.id)}
              onDrop={(files) => onDrop(files, doc.id)}
              isProcessing={isProcessing}
            />
          ))}
        </div>

        {/* Extracted Data Preview */}
        {Object.keys(extractedData).length > 0 && (
          <Card className="mb-6 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Sparkles className="h-5 w-5" />
                Automatisch Ingevuld
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {extractedData.companyName && (
                  <div>
                    <span className="font-medium">Bedrijfsnaam:</span>
                    <span className="ml-2 text-green-700">{extractedData.companyName}</span>
                  </div>
                )}
                {extractedData.kvkNumber && (
                  <div>
                    <span className="font-medium">KvK nummer:</span>
                    <span className="ml-2 text-green-700">{extractedData.kvkNumber}</span>
                  </div>
                )}
                {extractedData.address && (
                  <div>
                    <span className="font-medium">Adres:</span>
                    <span className="ml-2 text-green-700">{extractedData.address}</span>
                  </div>
                )}
                {extractedData.phone && (
                  <div>
                    <span className="font-medium">Telefoon:</span>
                    <span className="ml-2 text-green-700">{extractedData.phone}</span>
                  </div>
                )}
                {extractedData.email && (
                  <div>
                    <span className="font-medium">Email:</span>
                    <span className="ml-2 text-green-700">{extractedData.email}</span>
                  </div>
                )}
                {extractedData.website && (
                  <div>
                    <span className="font-medium">Website:</span>
                    <span className="ml-2 text-green-700">{extractedData.website}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Helper */}
        <Card className="border-purple-200 bg-purple-50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-purple-600 mt-1" />
              <div>
                <h4 className="font-semibold text-purple-800 mb-1">📱 Mobiel uploaden</h4>
                <p className="text-purple-700 text-sm mb-3">
                  Fotografeer documenten direct met uw telefoon. Onze AI leest automatisch alle gegevens uit.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-purple-300">
                    <Camera className="h-4 w-4 mr-2" />
                    Foto maken
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => setShowManualForm(true)} className="text-slate-600">
            Handmatig invullen
          </Button>

          <Button
            onClick={() => setCurrentStep(1)}
            disabled={!canProceed}
            className="bg-blue-700 hover:bg-blue-800 flex items-center gap-2"
          >
            Doorgaan naar controle
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {!canProceed && (
          <div className="flex items-center justify-center gap-2 mt-4 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Upload minimaal uw KvK uittreksel om door te gaan</span>
          </div>
        )}
      </div>
    )
  }

  // Review step
  if (currentStep === 1) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">Controleer uw gegevens</h1>
          <p className="text-lg text-slate-600">
            Controleer de automatisch ingevulde gegevens en vul eventuele ontbrekende informatie aan
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="companyName">Bedrijfsnaam</Label>
                <Input id="companyName" value={extractedData.companyName || ""} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="kvkNumber">KvK nummer</Label>
                <Input id="kvkNumber" value={extractedData.kvkNumber || ""} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="phone">Telefoon</Label>
                <Input id="phone" value={extractedData.phone || ""} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={extractedData.email || ""} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setCurrentStep(0)}>
            Terug
          </Button>
          <Button onClick={() => setCurrentStep(2)} className="bg-blue-700 hover:bg-blue-800">
            Account aanmaken
          </Button>
        </div>
      </div>
    )
  }

  // Success step
  return (
    <div className="container mx-auto max-w-2xl py-16 px-4 text-center">
      <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Welkom bij het platform!</h1>
      <p className="text-lg text-slate-600 mb-8">
        Uw account is succesvol aangemaakt. U kunt nu direct beginnen met het ontvangen van aanvragen.
      </p>
      <Button className="bg-blue-700 hover:bg-blue-800" size="lg">
        Naar dashboard
      </Button>
    </div>
  )
}

// Individual document upload card component
function DocumentUploadCard({
  document,
  upload,
  onDrop,
  isProcessing,
}: {
  document: any
  upload?: DocumentUpload
  onDrop: (files: File[]) => void
  isProcessing: boolean
}) {
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    onDrop(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    onDrop(files)
  }

  const Icon = document.icon
  const isCompleted = upload?.status === "completed"
  const isUploading = upload?.status === "uploading" || upload?.status === "processing"

  return (
    <Card
      className={`relative transition-all ${
        isCompleted
          ? "border-green-200 bg-green-50/50"
          : document.priority <= 2
            ? "border-blue-200 bg-blue-50/30"
            : "border-slate-200"
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-lg ${
              isCompleted ? "bg-green-100" : document.priority <= 2 ? "bg-blue-100" : "bg-slate-100"
            }`}
          >
            <Icon
              className={`h-6 w-6 ${
                isCompleted ? "text-green-600" : document.priority <= 2 ? "text-blue-600" : "text-slate-600"
              }`}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-slate-900">{document.name}</h3>
              {document.priority <= 2 && (
                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                  Verplicht
                </Badge>
              )}
              {isCompleted && <Badge className="bg-green-100 text-green-800 text-xs">✓ Compleet</Badge>}
            </div>

            <p className="text-sm text-slate-600 mb-3">{document.description}</p>

            {document.tips && <p className="text-xs text-slate-500 mb-4">💡 {document.tips}</p>}

            {!isCompleted && !isUploading && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setIsDragActive(true)}
                onDragLeave={() => setIsDragActive(false)}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-blue-400"
                }`}
              >
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf"
                  className="hidden"
                  id={`file-${document.id}`}
                />
                <label htmlFor={`file-${document.id}`} className="cursor-pointer">
                  <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    {isDragActive ? "Sleep hier..." : "Upload of sleep hier"}
                  </p>
                  <p className="text-xs text-slate-500">PDF, JPG, PNG • Max 10MB</p>
                </label>
              </div>
            )}

            {isUploading && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    {upload?.status === "uploading" ? "Uploaden..." : "AI leest document..."}
                  </p>
                  <p className="text-xs text-blue-600">Dit duurt enkele seconden</p>
                </div>
              </div>
            )}

            {isCompleted && upload?.extractedData && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Gegevens uitgelezen ({upload.confidence}% betrouwbaarheid)
                  </span>
                </div>
                <div className="text-xs text-green-700">
                  {Object.entries(upload.extractedData).map(([key, value]) => (
                    <div key={key}>• {Array.isArray(value) ? value.join(", ") : value}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
