"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  BarChart3,
  Users,
  Building,
  Euro,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  Settings,
  Shield,
} from "lucide-react"

// Mock admin data
const mockStats = {
  totalFamilies: 1247,
  activeFunerals: 23,
  totalDirectors: 156,
  totalVenues: 89,
  monthlyRevenue: 45600,
  conversionRate: 78,
  avgTicketSize: 4200,
  customerSatisfaction: 4.7,
}

const mockRecentActivity = [
  {
    id: 1,
    type: "booking",
    description: "Nieuwe boeking - Familie van der Berg",
    timestamp: "2 min geleden",
    status: "success",
    amount: 4200,
  },
  {
    id: 2,
    type: "director_signup",
    description: "Nieuwe uitvaartondernemer - Maria Visser",
    timestamp: "15 min geleden",
    status: "pending",
    location: "Rotterdam",
  },
  {
    id: 3,
    type: "venue_signup",
    description: "Nieuwe locatie - Protestantse Kerk Centrum",
    timestamp: "1 uur geleden",
    status: "success",
    location: "Utrecht",
  },
  {
    id: 4,
    type: "payment",
    description: "Betaling ontvangen - Familie Jansen",
    timestamp: "2 uur geleden",
    status: "success",
    amount: 100,
  },
  {
    id: 5,
    type: "support",
    description: "Support ticket - Documentupload probleem",
    timestamp: "3 uur geleden",
    status: "urgent",
    priority: "high",
  },
]

const mockDirectors = [
  {
    id: 1,
    name: "Jan de Boer",
    company: "Uitvaartzorg De Boer",
    location: "Amsterdam",
    rating: 4.8,
    completedFunerals: 45,
    revenue: 18500,
    status: "active",
    joinDate: "2023-03-15",
  },
  {
    id: 2,
    name: "Maria Visser",
    company: "Visser Uitvaarten",
    location: "Rotterdam",
    rating: 4.9,
    completedFunerals: 38,
    revenue: 15200,
    status: "active",
    joinDate: "2023-05-22",
  },
  {
    id: 3,
    name: "Ahmed Hassan",
    company: "Hassan Uitvaartbegeleiding",
    location: "Utrecht",
    rating: 4.7,
    completedFunerals: 29,
    revenue: 12100,
    status: "pending",
    joinDate: "2024-01-10",
  },
]

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "urgent":
        return "bg-red-100 text-red-800"
      case "active":
        return "bg-green-100 text-green-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "director_signup":
        return <Users className="h-4 w-4 text-blue-600" />
      case "venue_signup":
        return <Building className="h-4 w-4 text-purple-600" />
      case "payment":
        return <Euro className="h-4 w-4 text-green-600" />
      case "support":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-slate-600" />
    }
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Platform Beheer</h1>
          <p className="text-slate-600">Overzicht van alle platform activiteiten</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Rapport exporteren
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Instellingen
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Totaal families</p>
                <p className="text-2xl font-bold text-slate-900">{mockStats.totalFamilies.toLocaleString()}</p>
                <p className="text-xs text-green-600">↑ +12% deze maand</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Actieve uitvaarten</p>
                <p className="text-2xl font-bold text-slate-900">{mockStats.activeFunerals}</p>
                <p className="text-xs text-slate-500">In planning</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Maand omzet</p>
                <p className="text-2xl font-bold text-slate-900">€{mockStats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600">↑ +8% vs vorige maand</p>
              </div>
              <Euro className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Conversie rate</p>
                <p className="text-2xl font-bold text-slate-900">{mockStats.conversionRate}%</p>
                <p className="text-xs text-green-600">↑ +3% deze maand</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="directors">Ondernemers</TabsTrigger>
          <TabsTrigger value="venues">Locaties</TabsTrigger>
          <TabsTrigger value="families">Families</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Recente activiteit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRecentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{activity.description}</p>
                          <p className="text-sm text-slate-600">{activity.timestamp}</p>
                          {activity.amount && (
                            <p className="text-sm text-green-600 font-medium">€{activity.amount.toLocaleString()}</p>
                          )}
                          {activity.location && <p className="text-sm text-slate-500">{activity.location}</p>}
                        </div>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status === "success"
                            ? "Voltooid"
                            : activity.status === "pending"
                              ? "In behandeling"
                              : "Urgent"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform statistieken</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Uitvaartondernemers</span>
                      <span className="font-semibold">{mockStats.totalDirectors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Locaties</span>
                      <span className="font-semibold">{mockStats.totalVenues}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Gem. ticket grootte</span>
                      <span className="font-semibold">€{mockStats.avgTicketSize.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Klanttevredenheid</span>
                      <span className="font-semibold">⭐ {mockStats.customerSatisfaction}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800">Systeem status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">Platform</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">Betalingen</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">Documenten</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">Communicatie</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Veiligheid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-blue-700">
                    <p>• SSL certificaat actief</p>
                    <p>• GDPR compliant</p>
                    <p>• Zero-knowledge encryptie</p>
                    <p>• Dagelijkse backups</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="directors">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Uitvaartondernemers</CardTitle>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Zoek ondernemers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDirectors.map((director) => (
                  <div key={director.id} className="border rounded-lg p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900">{director.name}</h3>
                          <Badge className={getStatusColor(director.status)}>
                            {director.status === "active" ? "Actief" : "In behandeling"}
                          </Badge>
                        </div>
                        <p className="text-slate-600 mb-1">{director.company}</p>
                        <p className="text-sm text-slate-500 mb-2">{director.location}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">Rating:</span>
                            <span className="ml-1 font-medium">⭐ {director.rating}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Uitvaarten:</span>
                            <span className="ml-1 font-medium">{director.completedFunerals}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Omzet:</span>
                            <span className="ml-1 font-medium">€{director.revenue.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Lid sinds:</span>
                            <span className="ml-1 font-medium">
                              {new Date(director.joinDate).toLocaleDateString("nl-NL")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Bekijken
                        </Button>
                        <Button size="sm" variant="outline">
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="venues">
          <Card>
            <CardHeader>
              <CardTitle>Locaties beheer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Overzicht van alle aangesloten locaties...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="families">
          <Card>
            <CardHeader>
              <CardTitle>Families overzicht</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Overzicht van alle families en hun uitvaarten...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Platform analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Gedetailleerde analytics en rapporten...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
