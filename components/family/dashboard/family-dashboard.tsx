"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Users,
  Calendar,
  CreditCard,
  MessageSquare,
  Phone,
  Download,
  Share,
  Heart,
} from "lucide-react"

// Mock data for family dashboard
const mockFamilyData = {
  deceased: {
    name: "Henk van der Berg",
    dateOfDeath: "2024-01-10",
    serviceDate: "2024-01-20",
  },
  progress: {
    overall: 75,
    steps: [
      { name: "Basisgegevens", completed: true },
      { name: "Type uitvaart", completed: true },
      { name: "Locatie gekozen", completed: true },
      { name: "Uitvaartondernemer", completed: true },
      { name: "Catering", completed: false },
      { name: "Bloemen", completed: false },
      { name: "Muziek", completed: false },
      { name: "Finale details", completed: false },
    ],
  },
  director: {
    name: "Jan de Boer",
    company: "Uitvaartzorg De Boer",
    phone: "06-12345678",
    email: "jan@deboer-uitvaart.nl",
    lastContact: "2 uur geleden",
  },
  venue: {
    name: "Westgaarde Crematorium",
    address: "Westgaardeweg 1, Amsterdam",
    time: "14:00 - 16:00",
  },
  costs: {
    estimated: 8500,
    confirmed: 6200,
    insurance: 5000,
    outOfPocket: 1200,
  },
  documents: [
    { name: "Overlijdensakte", status: "uploaded", required: true },
    { name: "Crematievergunning", status: "pending", required: true },
    { name: "Verzekeringspolis", status: "uploaded", required: false },
    { name: "Foto's voor herdenking", status: "missing", required: false },
  ],
  contacts: {
    invited: 45,
    confirmed: 32,
    pending: 13,
  },
}

export function FamilyDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

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

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">Uitvaart {mockFamilyData.deceased.name}</h1>
            <p className="text-slate-600">
              {new Date(mockFamilyData.deceased.serviceDate).toLocaleDateString("nl-NL", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Voortgang planning</h3>
              <span className="text-2xl font-bold text-purple-700">{mockFamilyData.progress.overall}%</span>
            </div>
            <Progress value={mockFamilyData.progress.overall} className="h-3 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {mockFamilyData.progress.steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-slate-400" />
                  )}
                  <span className={step.completed ? "text-green-700" : "text-slate-600"}>{step.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="documents">Documenten</TabsTrigger>
          <TabsTrigger value="contacts">Contacten</TabsTrigger>
          <TabsTrigger value="costs">Kosten</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Uitvaartdetails
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Locatie</h4>
                      <p className="text-slate-600">{mockFamilyData.venue.name}</p>
                      <p className="text-sm text-slate-500">{mockFamilyData.venue.address}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Tijd</h4>
                      <p className="text-slate-600">{mockFamilyData.venue.time}</p>
                      <p className="text-sm text-slate-500">Ontvangst vanaf 13:30</p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4 border-t">
                    <Button size="sm" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Agenda toevoegen
                    </Button>
                    <Button size="sm" variant="outline">
                      <Share className="h-4 w-4 mr-2" />
                      Delen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Director Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Uw uitvaartondernemer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{mockFamilyData.director.name}</h4>
                      <p className="text-slate-600">{mockFamilyData.director.company}</p>
                      <p className="text-sm text-slate-500">Laatste contact: {mockFamilyData.director.lastContact}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Bellen
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Bericht
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-amber-800 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Volgende stappen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 rounded-full p-1 mt-1">
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-800">Catering bevestigen</p>
                        <p className="text-sm text-amber-700">Aantal gasten doorgeven voor na de dienst</p>
                        <Button size="sm" className="mt-2 bg-amber-600 hover:bg-amber-700">
                          Nu regelen
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Cost Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Kosten overzicht
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Totaal geschat</span>
                      <span className="font-semibold">€{mockFamilyData.costs.estimated.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Bevestigd</span>
                      <span className="font-semibold">€{mockFamilyData.costs.confirmed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Verzekering</span>
                      <span>-€{mockFamilyData.costs.insurance.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold">
                        <span>Eigen bijdrage</span>
                        <span>€{mockFamilyData.costs.outOfPocket.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    Gedetailleerd overzicht
                  </Button>
                </CardContent>
              </Card>

              {/* Documents Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documenten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockFamilyData.documents.slice(0, 3).map((doc, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(doc.status)}
                          <span className="text-sm text-slate-600">{doc.name}</span>
                        </div>
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status === "uploaded" ? "✓" : doc.status === "pending" ? "..." : "!"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    Alle documenten
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Snelle acties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Rapport downloaden
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Share className="h-4 w-4 mr-2" />
                    Uitnodiging delen
                  </Button>
                  <Button className="w-full" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Hulp vragen
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document beheer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockFamilyData.documents.map((doc, index) => (
                  <div key={index} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(doc.status)}
                      <div>
                        <p className="font-medium text-slate-900">{doc.name}</p>
                        <p className="text-sm text-slate-500">{doc.required ? "Verplicht" : "Optioneel"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status === "uploaded"
                          ? "Geüpload"
                          : doc.status === "pending"
                            ? "In behandeling"
                            : "Ontbreekt"}
                      </Badge>
                      {doc.status === "missing" && <Button size="sm">Uploaden</Button>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Gasten beheer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{mockFamilyData.contacts.invited}</div>
                  <p className="text-slate-600">Uitgenodigd</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{mockFamilyData.contacts.confirmed}</div>
                  <p className="text-slate-600">Bevestigd</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{mockFamilyData.contacts.pending}</div>
                  <p className="text-slate-600">Nog geen reactie</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Contacten toevoegen
                </Button>
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Herinnering sturen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Kosten overzicht</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Gedetailleerd kostenoverzicht komt hier...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
