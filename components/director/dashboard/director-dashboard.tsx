"use client"

/**
 * DIRECTOR DASHBOARD - COMPREHENSIVE CLIENT MANAGEMENT
 *
 * Features:
 * - Client actions and follow-ups
 * - Family code generation and sending
 * - Direct messaging to clients
 * - Family report viewing (from onboarding/chat)
 * - Venue browsing integration
 * - Performance metrics
 */

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import {
  Users,
  Calendar,
  MapPin,
  Building,
  Search,
  Euro,
  Plus,
  Eye,
  Send,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Download,
  Share2,
} from "lucide-react"

const DirectorDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedClient, setSelectedClient] = useState(null)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Welkom terug, hier zijn uw klanten en acties</p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/director/clients/new">
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Klant
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/venues/browse">
              <Building className="h-4 w-4 mr-2" />
              Locaties Zoeken
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="clients">Klanten</TabsTrigger>
          <TabsTrigger value="codes">Familie Codes</TabsTrigger>
          <TabsTrigger value="calendar">Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics - Keep the good ones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actieve Klanten</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 deze week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Komende Diensten</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">Deze week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Omzet Deze Maand</CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€45,230</div>
                <p className="text-xs text-muted-foreground">+12% vs vorige maand</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acties Vereist</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">7</div>
                <p className="text-xs text-muted-foreground">Wachten op actie</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Actions - The Heart of the Dashboard */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Klant Acties & Follow-ups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      client: "Familie van der Berg",
                      action: "Familie code versturen",
                      priority: "high",
                      time: "2 uur geleden",
                      type: "code",
                      hasReport: true,
                    },
                    {
                      client: "Familie Jansen",
                      action: "Locatie bevestiging nodig",
                      priority: "high",
                      time: "4 uur geleden",
                      type: "venue",
                      hasReport: false,
                    },
                    {
                      client: "Familie de Wit",
                      action: "Bericht versturen over dienst details",
                      priority: "medium",
                      time: "1 dag geleden",
                      type: "message",
                      hasReport: true,
                    },
                    {
                      client: "Familie Bakker",
                      action: "Familie rapport bekijken",
                      priority: "medium",
                      time: "2 dagen geleden",
                      type: "report",
                      hasReport: true,
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.priority === "high" ? "bg-red-100" : "bg-blue-100"
                          }`}
                        >
                          {item.type === "code" && <Send className="h-4 w-4 text-red-600" />}
                          {item.type === "venue" && <Building className="h-4 w-4 text-red-600" />}
                          {item.type === "message" && <MessageSquare className="h-4 w-4 text-blue-600" />}
                          {item.type === "report" && <FileText className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div>
                          <p className="font-medium">{item.client}</p>
                          <p className="text-sm text-slate-600">{item.action}</p>
                          <p className="text-xs text-slate-500">{item.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.hasReport && (
                          <Button variant="ghost" size="sm" title="Familie rapport bekijken">
                            <FileText className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Badge variant={item.priority === "high" ? "destructive" : "default"}>
                          {item.priority === "high" ? "Urgent" : "Normaal"}
                        </Badge>
                        <div className="flex gap-1">
                          {item.type === "code" && (
                            <Button size="sm">
                              <Send className="h-4 w-4 mr-1" />
                              Code Versturen
                            </Button>
                          )}
                          {item.type === "message" && (
                            <Button size="sm">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Bericht
                            </Button>
                          )}
                          {item.type === "venue" && (
                            <Button size="sm" asChild>
                              <Link href="/venues/browse">
                                <Building className="h-4 w-4 mr-1" />
                                Locaties
                              </Link>
                            </Button>
                          )}
                          {item.type === "report" && (
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Rapport
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Sidebar */}
            <div className="space-y-6">
              {/* Familie Codes Versturen */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Familie Code Versturen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Familie naam..." />
                  <Input placeholder="Email adres..." />
                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Code Genereren & Versturen
                  </Button>
                  <p className="text-xs text-slate-600">Familie krijgt toegang tot hun persoonlijke portal</p>
                </CardContent>
              </Card>

              {/* Locaties Zoeken */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Locaties Zoeken
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Binnen 10km:</span>
                        <span className="font-semibold">12 locaties</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Beschikbaar vandaag:</span>
                        <span className="font-semibold text-green-600">8 locaties</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Uw tarieven:</span>
                        <span className="font-semibold text-blue-600">5 locaties</span>
                      </div>
                    </div>

                    <Button asChild className="w-full">
                      <Link href="/venues/browse">
                        <Search className="h-4 w-4 mr-2" />
                        Alle Locaties
                      </Link>
                    </Button>

                    <Button asChild variant="outline" className="w-full">
                      <Link href="/venues/browse?view=map">
                        <MapPin className="h-4 w-4 mr-2" />
                        Kaart Weergave
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Snel Bericht Versturen */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Snel Bericht
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Aan familie..." />
                  <Textarea placeholder="Uw bericht..." rows={3} />
                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      Versturen
                    </Button>
                    <Button variant="outline" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Familie Rapporten Overzicht - NIEUW! */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Familie Rapporten & Onboarding Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    family: "Familie van der Berg",
                    status: "Compleet",
                    progress: 100,
                    lastUpdate: "2 uur geleden",
                    hasChat: true,
                    reportReady: true,
                  },
                  {
                    family: "Familie Jansen",
                    status: "In behandeling",
                    progress: 75,
                    lastUpdate: "1 dag geleden",
                    hasChat: true,
                    reportReady: false,
                  },
                  {
                    family: "Familie de Wit",
                    status: "Wacht op info",
                    progress: 45,
                    lastUpdate: "3 dagen geleden",
                    hasChat: false,
                    reportReady: false,
                  },
                ].map((report, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{report.family}</h4>
                      <Badge variant={report.status === "Compleet" ? "default" : "secondary"}>{report.status}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Voortgang</span>
                        <span>{report.progress}%</span>
                      </div>
                      <Progress value={report.progress} />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>{report.lastUpdate}</span>
                      <div className="flex items-center gap-1">
                        {report.hasChat && <MessageSquare className="h-3 w-3 text-green-600" />}
                        {report.reportReady && <CheckCircle className="h-3 w-3 text-green-600" />}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        Bekijken
                      </Button>
                      {report.reportReady && (
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Share2 className="h-3 w-3 mr-1" />
                        Delen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alle Klanten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Klanten Overzicht</h3>
                <p className="text-slate-600 mb-4">Beheer al uw klanten en hun uitvaartzaken</p>
                <Button asChild>
                  <Link href="/director/clients">Ga naar Klanten Beheer</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="codes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Familie Codes Beheer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { family: "Familie van der Berg", code: "VDB-2024-001", status: "Actief", used: true },
                  { family: "Familie Jansen", code: "JAN-2024-002", status: "Verzonden", used: false },
                  { family: "Familie de Wit", code: "WIT-2024-003", status: "Gebruikt", used: true },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.family}</p>
                      <p className="text-sm text-slate-600">Code: {item.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.used ? "default" : "outline"}>{item.status}</Badge>
                      <Button variant="ghost" size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Familie Code Genereren
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agenda Overzicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Uw Agenda</h3>
                <p className="text-slate-600 mb-4">Bekijk en beheer al uw afspraken en diensten</p>
                <Button asChild>
                  <Link href="/director/calendar">Open Volledige Agenda</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DirectorDashboard
