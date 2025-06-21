"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  FileText,
  ImageIcon,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Download,
  Camera,
  Smartphone,
} from "lucide-react"
import { useDropzone } from "react-dropzone"

interface DocumentType {
  id: string
  name: string
  description: string
  required: boolean
  category: "legal" | "insurance" | "personal" | "memorial"
  acceptedTypes: string[]
  maxSize: number // in MB
  examples?: string[]
}

interface UploadedDocument {
  id: string
  name: string
  type: string
  size: number
  uploadDate: Date
  status: "uploading" | "processing" | "completed" | "error"
  documentTypeId: string
  url?: string
  thumbnailUrl?: string
}

const documentTypes: DocumentType[] = [
  {
    id: "death-certificate",
    name: "Overlijdensakte",
    description: "Officiële overlijdensakte van de gemeente",
    required: true,
    category: "legal",
    acceptedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxSize: 10,
    examples: ["Uittreksel BRP", "Overlijdensakte gemeente"],
  },
  {
    id: "id-document",
    name: "Identiteitsbewijs overledene",
    description: "Paspoort of ID-kaart van de overledene",
    required: true,
    category: "legal",
    acceptedTypes: ["image/jpeg", "image/png", "application/pdf"],
    maxSize: 5,
  },
  {
    id: "insurance-policy",
    name: "Uitvaartverzekering",
    description: "Polis en voorwaarden van de uitvaartverzekering",
    required: false,
    category: "insurance",
    acceptedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxSize: 10,
    examples: ["DELA polis", "Monuta verzekering", "Yarden contract"],
  },
  {
    id: "medical-documents",
    name: "Medische documenten",
    description: "Verklaring van natuurlijke dood (indien van toepassing)",
    required: false,
    category: "legal",
    acceptedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxSize: 10,
  },
  {
    id: "memorial-photos",
    name: "Foto's voor herdenking",
    description: "Mooie foto's voor tijdens de uitvaartdienst",
    required: false,
    category: "memorial",
    acceptedTypes: ["image/jpeg", "image/png", "image/heic"],
    maxSize: 25,
    examples: ["Portretfoto's", "Familie foto's", "Hobby foto's"],
  },
  {
    id: "personal-documents",
    name: "Persoonlijke documenten",
    description: "Testament, volmacht, of andere belangrijke documenten",
    required: false,
    category: "personal",
    acceptedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxSize: 10,
  },
  {
    id: "financial-documents",
    name: "Financiële documenten",
    description: "Bankgegevens, rekeningen, of andere financiële informatie",
    required: false,
    category: "personal",
    acceptedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxSize: 10,
  },
]

export function FamilyDocumentUpload() {
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[], documentTypeId: string) => {
    acceptedFiles.forEach((file) => {
      const newDocument: UploadedDocument = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date(),
        status: "uploading",
        documentTypeId,
      }

      setUploadedDocuments((prev) => [...prev, newDocument])

      // Simulate upload process
      setTimeout(() => {
        setUploadedDocuments((prev) =>
          prev.map((doc) => (doc.id === newDocument.id ? { ...doc, status: "processing" } : doc)),
        )
      }, 1000)

      setTimeout(() => {
        setUploadedDocuments((prev) =>
          prev.map((doc) =>
            doc.id === newDocument.id
              ? {
                  ...doc,
                  status: "completed",
                  url: URL.createObjectURL(file),
                  thumbnailUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
                }
              : doc,
          ),
        )
      }, 3000)
    })
  }, [])

  const getDocumentsByType = (documentTypeId: string) => {
    return uploadedDocuments.filter((doc) => doc.documentTypeId === documentTypeId)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "uploading":
      case "processing":
        return <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "uploading":
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const removeDocument = (documentId: string) => {
    setUploadedDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
  }

  const categories = [
    { id: "all", name: "Alle documenten", count: uploadedDocuments.length },
    {
      id: "legal",
      name: "Juridische documenten",
      count: uploadedDocuments.filter(
        (d) => documentTypes.find((dt) => dt.id === d.documentTypeId)?.category === "legal",
      ).length,
    },
    {
      id: "insurance",
      name: "Verzekeringen",
      count: uploadedDocuments.filter(
        (d) => documentTypes.find((dt) => dt.id === d.documentTypeId)?.category === "insurance",
      ).length,
    },
    {
      id: "memorial",
      name: "Herdenking",
      count: uploadedDocuments.filter(
        (d) => documentTypes.find((dt) => dt.id === d.documentTypeId)?.category === "memorial",
      ).length,
    },
    {
      id: "personal",
      name: "Persoonlijk",
      count: uploadedDocuments.filter(
        (d) => documentTypes.find((dt) => dt.id === d.documentTypeId)?.category === "personal",
      ).length,
    },
  ]

  const filteredDocumentTypes =
    selectedCategory === "all" ? documentTypes : documentTypes.filter((dt) => dt.category === selectedCategory)

  const completedRequired = documentTypes
    .filter((dt) => dt.required)
    .every((dt) => getDocumentsByType(dt.id).some((doc) => doc.status === "completed"))

  const totalRequired = documentTypes.filter((dt) => dt.required).length
  const completedRequiredCount = documentTypes.filter(
    (dt) => dt.required && getDocumentsByType(dt.id).some((doc) => doc.status === "completed"),
  ).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-purple-600" />
            Document Upload Center
          </CardTitle>
          <div className="space-y-3">
            <p className="text-slate-600">
              Upload de benodigde documenten voor uw uitvaart. Alle documenten worden veilig opgeslagen en alleen
              gedeeld met uw uitvaartondernemer.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Verplichte documenten:</span>
                <Badge className={completedRequired ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                  {completedRequiredCount}/{totalRequired} compleet
                </Badge>
              </div>
              <Progress value={(completedRequiredCount / totalRequired) * 100} className="flex-1 max-w-xs" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center gap-2"
          >
            {category.name}
            {category.count > 0 && (
              <Badge variant="secondary" className="ml-1">
                {category.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Document Types */}
      <div className="grid gap-6">
        {filteredDocumentTypes.map((docType) => {
          const documents = getDocumentsByType(docType.id)
          const hasCompleted = documents.some((doc) => doc.status === "completed")

          return (
            <DocumentUploadCard
              key={docType.id}
              documentType={docType}
              documents={documents}
              onDrop={(files, rejected) => onDrop(files, rejected, docType.id)}
              onRemove={removeDocument}
              hasCompleted={hasCompleted}
            />
          )
        })}
      </div>

      {/* Mobile Upload Helper */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">📱 Tip voor mobiele gebruikers</h4>
              <p className="text-blue-700 text-sm mb-3">
                U kunt documenten direct fotograferen met uw telefoon. Zorg voor goede belichting en houd de camera
                recht boven het document.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-blue-300">
                  <Camera className="h-4 w-4 mr-2" />
                  Foto maken
                </Button>
                <Button size="sm" variant="outline" className="border-blue-300">
                  <Upload className="h-4 w-4 mr-2" />
                  Bestand kiezen
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <p className="text-amber-800 text-sm">
            <strong>Hulp nodig met uploaden?</strong> Onze AI-assistent kan u helpen met het uploaden van documenten.
            Klik op de paarse hulp-knop rechtsonder voor persoonlijke begeleiding.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Individual document upload card component
function DocumentUploadCard({
  documentType,
  documents,
  onDrop,
  onRemove,
  hasCompleted,
}: {
  documentType: DocumentType
  documents: UploadedDocument[]
  onDrop: (files: File[], rejected: any[]) => void
  onRemove: (id: string) => void
  hasCompleted: boolean
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: documentType.acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: documentType.maxSize * 1024 * 1024,
    multiple: documentType.category === "memorial",
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "uploading":
      case "processing":
        return <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "uploading":
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  return (
    <Card
      className={`${hasCompleted ? "border-green-200 bg-green-50/30" : documentType.required ? "border-amber-200 bg-amber-50/30" : ""}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${hasCompleted ? "bg-green-100" : documentType.required ? "bg-amber-100" : "bg-slate-100"}`}
            >
              <FileText
                className={`h-5 w-5 ${hasCompleted ? "text-green-600" : documentType.required ? "text-amber-600" : "text-slate-600"}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">{documentType.name}</h3>
                {documentType.required && (
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                    Verplicht
                  </Badge>
                )}
                {hasCompleted && <Badge className="bg-green-100 text-green-800 text-xs">✓ Compleet</Badge>}
              </div>
              <p className="text-sm text-slate-600 mt-1">{documentType.description}</p>
              {documentType.examples && (
                <div className="mt-2">
                  <p className="text-xs text-slate-500">Voorbeelden: {documentType.examples.join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload Area */}
        {!hasCompleted && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-purple-400 bg-purple-50"
                : "border-slate-300 hover:border-purple-400 hover:bg-purple-50/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-1">
              {isDragActive ? "Sleep bestanden hier..." : "Sleep bestanden hier of klik om te selecteren"}
            </p>
            <p className="text-xs text-slate-500">
              Toegestaan: {documentType.acceptedTypes.map((type) => type.split("/")[1].toUpperCase()).join(", ")}• Max{" "}
              {documentType.maxSize}MB
            </p>
          </div>
        )}

        {/* Uploaded Documents */}
        {documents.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">Geüploade bestanden:</h4>
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className="flex-shrink-0">
                  {doc.thumbnailUrl ? (
                    <ImageIcon
                      src={doc.thumbnailUrl || "/placeholder.svg"}
                      alt={doc.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <FileText className="h-10 w-10 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{formatFileSize(doc.size)}</span>
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status === "uploading" && "Uploaden..."}
                      {doc.status === "processing" && "Verwerken..."}
                      {doc.status === "completed" && "Compleet"}
                      {doc.status === "error" && "Fout"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(doc.status)}
                  {doc.status === "completed" && (
                    <>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onRemove(doc.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
