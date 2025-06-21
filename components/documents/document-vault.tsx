"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Upload,
  Download,
  Share,
  Eye,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Lock,
  Shield,
} from "lucide-react"

// Mock document data
const mockDocuments = [
  {
    id: 1,
    name: "Overlijdensakte",
    type: "official",
    status: "uploaded",
    uploadDate: "2024-01-15",
    size: "2.3 MB",
    required: true,
    sharedWith: ["Jan de Boer", "Gemeente Amsterdam"],
    category: "Officiële documenten",
    description: "Officiële overlijdensakte van de gemeente",
  },
  {
    id: 2,
    name: "Crematievergunning",
    type: "official",
    status: "pending",
    uploadDate: "2024-01-16",
    size: "1.8 MB",
    required: true,
    sharedWith: ["Jan de Boer"],
    category: "Officiële documenten",
    description: "Vergunning voor crematie procedure",
  },
  {
    id: 3,
    name: "Verzekeringspolis DELA",
    type: "insurance",
    status: "uploaded",
    uploadDate: "2024-01-14",
    size: "4.1 MB",
    required: false,
    sharedWith: ["Jan de Boer", "DELA Verzekeringen"],
    category: "Verzekering",
    description: "Uitvaartverzekering polis en voorwaarden",
  },
  {
    id: 4,
    name: "Foto's voor herdenking",
    type: "personal",
    status: "uploaded",
    uploadDate: "2024-01-17",
    size: "15.2 MB",
    required: false,
    sharedWith: ["Jan de Boer"],
    category: "Persoonlijke documenten",
    description: "Foto's voor tijdens de ceremonie",
  },
  {
    id: 5,
    name: "Testament",
    type: "legal",
    status: "missing",
    uploadDate: null,
    size: null,
    required: false,
    sharedWith: [],
    category: "Juridische documenten",
    description: "Laatste wilsbeschikking (indien aanwezig)",
  },
  {
    id: 6,
    name: "Muziekwensen",
    type: "personal",
    status: "uploaded",
    uploadDate: "2024-01-16",
    size: "0.5 MB",
    required: false,
    sharedWith: ["Jan de Boer"],
    category: "Persoonlijke documenten",
    description: "Lijst met gewenste muziek voor de ceremonie",
  },
]

const documentCategories = [
  "Alle documenten",
  "Officiële documenten",
  "Verzekering",
  "Persoonlijke documenten",
  "Juridische documenten",
]

export function DocumentVault() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Alle documenten")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "uploaded":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "missing":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploaded":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "missing":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "official":
        return <Shield className="h-5 w-5 text-blue-600" />
      case "insurance":
        return <Lock className="h-5 w-5 text-purple-600" />
      case "legal":
        return <FileText className="h-5 w-5 text-slate-600" />
      default:
        return <FileText className="h-5 w-5 text-slate-600" />
    }
  }

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "Alle documenten" || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const requiredDocs = mockDocuments.filter((doc) => doc.required)
  const completedRequired = requiredDocs.filter((doc) => doc.status === "uploaded").length
  const completionPercentage = (completedRequired / requiredDocs.length) * 100

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)
      setUploadProgress(0)

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsUploading(false)
            return 100
          }
          return prev + 10
        })
      }, 200)
    }
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Document kluis</h1>
          <p className="text-slate-600">Veilige opslag van alle belangrijke documenten</p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <Button asChild className="bg-purple-700 hover:bg-purple-800">
            <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Document uploaden
            </label>
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="mb-8 border-purple-200 bg-purple-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Verplichte documenten</h3>
            <span className="text-2xl font-bold text-purple-700">{Math.round(completionPercentage)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-3 mb-4" />
          <p className="text-slate-600 text-sm">
            {completedRequired} van {requiredDocs.length} verplichte documenten geüpload
          </p>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {isUploading && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-blue-800">Document wordt geüpload...</p>
                <Progress value={uploadProgress} className="h-2 mt-2" />
              </div>
              <span className="text-blue-600 font-medium">{uploadProgress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Zoek documenten..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-600" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2"
              >
                {documentCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">Alle documenten</TabsTrigger>
          <TabsTrigger value="required">Verplicht</TabsTrigger>
          <TabsTrigger value="shared">Gedeeld</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="bg-slate-50 rounded-lg p-3">{getTypeIcon(doc.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900">{doc.name}</h3>
                          {doc.required && <Badge variant="outline">Verplicht</Badge>}
                          <Badge className={getStatusColor(doc.status)}>
                            {doc.status === "uploaded"
                              ? "Geüpload"
                              : doc.status === "pending"
                                ? "In behandeling"
                                : "Ontbreekt"}
                          </Badge>
                        </div>
                        <p className="text-slate-600 text-sm mb-2">{doc.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Categorie: {doc.category}</span>
                          {doc.size && <span>Grootte: {doc.size}</span>}
                          {doc.uploadDate && (
                            <span>Geüpload: {new Date(doc.uploadDate).toLocaleDateString("nl-NL")}</span>
                          )}
                        </div>
                        {doc.sharedWith.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-slate-500 mb-1">Gedeeld met:</p>
                            <div className="flex flex-wrap gap-1">
                              {doc.sharedWith.map((person, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {person}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(doc.status)}
                      <div className="flex gap-1">
                        {doc.status === "uploaded" && (
                          <>
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Share className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {doc.status === "missing" && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Upload className="h-3 w-3 mr-1" />
                            Uploaden
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="required">
          <div className="grid gap-4">
            {requiredDocs.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-50 rounded-lg p-3">{getTypeIcon(doc.type)}</div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{doc.name}</h3>
                        <p className="text-slate-600 text-sm">{doc.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(doc.status)}
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status === "uploaded"
                          ? "Geüpload"
                          : doc.status === "pending"
                            ? "In behandeling"
                            : "Ontbreekt"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shared">
          <Card>
            <CardHeader>
              <CardTitle>Gedeelde documenten</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Overzicht van documenten die gedeeld zijn met anderen...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent geüploade documenten</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Laatst toegevoegde documenten...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Notice */}
      <Card className="mt-8 border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-semibold text-green-800 mb-2">Veiligheid & Privacy</h3>
              <p className="text-green-700 text-sm mb-3">
                Alle documenten worden versleuteld opgeslagen met zero-knowledge encryptie. Alleen u heeft toegang tot
                uw documenten.
              </p>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• End-to-end versleuteling</li>
                <li>• GDPR compliant</li>
                <li>• Automatische backup</li>
                <li>• Toegang logging</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
