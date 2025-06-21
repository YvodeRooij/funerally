"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Calendar,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
} from "lucide-react"

// Mock analytics data
const revenueData = [
  { month: "Jan", revenue: 45600, bookings: 23, avgTicket: 1983 },
  { month: "Feb", revenue: 52300, bookings: 28, avgTicket: 1868 },
  { month: "Mar", revenue: 48900, bookings: 25, avgTicket: 1956 },
  { month: "Apr", revenue: 61200, bookings: 32, avgTicket: 1913 },
  { month: "Mei", revenue: 58700, bookings: 29, avgTicket: 2024 },
  { month: "Jun", revenue: 67800, bookings: 35, avgTicket: 1937 },
]

const userGrowthData = [
  { month: "Jan", families: 1180, directors: 142, venues: 78 },
  { month: "Feb", families: 1205, directors: 145, venues: 81 },
  { month: "Mar", families: 1234, directors: 148, venues: 83 },
  { month: "Apr", families: 1267, directors: 152, venues: 86 },
  { month: "Mei", families: 1298, directors: 156, venues: 89 },
  { month: "Jun", families: 1342, directors: 161, venues: 92 },
]

const regionData = [
  { name: "Noord-Holland", value: 35, color: "#8B5CF6" },
  { name: "Zuid-Holland", value: 28, color: "#06B6D4" },
  { name: "Utrecht", value: 18, color: "#10B981" },
  { name: "Noord-Brabant", value: 12, color: "#F59E0B" },
  { name: "Overig", value: 7, color: "#EF4444" },
]

const satisfactionData = [
  { category: "Platform ervaring", score: 4.7, responses: 1247 },
  { category: "Uitvaartondernemers", score: 4.8, responses: 892 },
  { category: "Locaties", score: 4.6, responses: 743 },
  { category: "Documentbeheer", score: 4.5, responses: 1156 },
  { category: "Betalingen", score: 4.9, responses: 1089 },
  { category: "Communicatie", score: 4.4, responses: 967 },
]

const conversionFunnelData = [
  { stage: "Website bezoekers", count: 15420, percentage: 100 },
  { stage: "Registraties gestart", count: 3847, percentage: 25 },
  { stage: "Profiel voltooid", count: 2893, percentage: 19 },
  { stage: "Eerste contact", count: 2156, percentage: 14 },
  { stage: "Boeking geplaatst", count: 1678, percentage: 11 },
  { stage: "Betaling voltooid", count: 1534, percentage: 10 },
]

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("6m")
  const [activeTab, setActiveTab] = useState("overview")

  const currentMonthRevenue = 67800
  const previousMonthRevenue = 58700
  const revenueGrowth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100

  const currentMonthBookings = 35
  const previousMonthBookings = 29
  const bookingGrowth = ((currentMonthBookings - previousMonthBookings) / previousMonthBookings) * 100

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">Platform Analytics</h2>
          <p className="text-slate-600">Gedetailleerde inzichten in platform prestaties</p>
        </div>
        <div className="flex gap-2">
          {["1m", "3m", "6m", "1j"].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Maand omzet</p>
                <p className="text-2xl font-bold text-slate-900">€{currentMonthRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+{revenueGrowth.toFixed(1)}%</span>
                </div>
              </div>
              <Euro className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Boekingen</p>
                <p className="text-2xl font-bold text-slate-900">{currentMonthBookings}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+{bookingGrowth.toFixed(1)}%</span>
                </div>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Conversie rate</p>
                <p className="text-2xl font-bold text-slate-900">10.0%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+0.8%</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Tevredenheid</p>
                <p className="text-2xl font-bold text-slate-900">4.7⭐</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+0.2</span>
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="revenue">Omzet</TabsTrigger>
          <TabsTrigger value="users">Gebruikers</TabsTrigger>
          <TabsTrigger value="satisfaction">Tevredenheid</TabsTrigger>
          <TabsTrigger value="conversion">Conversie</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Omzet ontwikkeling</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`€${value.toLocaleString()}`, "Omzet"]} />
                    <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Gebruikersgroei</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="families" stroke="#06B6D4" name="Families" />
                    <Line type="monotone" dataKey="directors" stroke="#10B981" name="Ondernemers" />
                    <Line type="monotone" dataKey="venues" stroke="#F59E0B" name="Locaties" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Regional Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Regionale verdeling</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={regionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {regionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Belangrijke metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Gemiddelde ticket grootte</span>
                    <span className="font-semibold">€1,937</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Tijd tot eerste boeking</span>
                    <span className="font-semibold">2.3 dagen</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Platform commissie</span>
                    <span className="font-semibold">€12,450</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Actieve gebruikers (MAU)</span>
                    <span className="font-semibold">3,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Support tickets</span>
                    <span className="font-semibold text-green-600">23 (-15%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="satisfaction">
          <Card>
            <CardHeader>
              <CardTitle>Klanttevredenheid per categorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {satisfactionData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-900">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">⭐ {item.score}</span>
                        <span className="text-sm text-slate-500">({item.responses} reviews)</span>
                      </div>
                    </div>
                    <Progress value={(item.score / 5) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion">
          <Card>
            <CardHeader>
              <CardTitle>Conversie funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnelData.map((stage, index) => (
                  <div key={index} className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-slate-900">{stage.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{stage.count.toLocaleString()}</span>
                        <span className="text-sm text-slate-500">({stage.percentage}%)</span>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={stage.percentage} className="h-3" />
                      {index < conversionFunnelData.length - 1 && (
                        <div className="absolute -bottom-2 right-0 text-xs text-red-600">
                          -
                          {(
                            conversionFunnelData[index].percentage - conversionFunnelData[index + 1].percentage
                          ).toFixed(1)}
                          %
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alerts & Recommendations */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Aandachtspunten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-yellow-600 mt-1" />
                <div>
                  <p className="font-medium text-yellow-800">Langere responstijd support</p>
                  <p className="text-sm text-yellow-700">Gemiddelde responstijd is gestegen naar 4.2 uur</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingDown className="h-4 w-4 text-yellow-600 mt-1" />
                <div>
                  <p className="font-medium text-yellow-800">Conversie daling Noord-Brabant</p>
                  <p className="text-sm text-yellow-700">15% daling in conversie rate deze regio</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Aanbevelingen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-green-800">Uitbreiden naar Limburg</p>
                  <p className="text-sm text-green-700">Hoge vraag gedetecteerd, potentieel +€15k/maand</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-4 w-4 text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-green-800">Premium service tier</p>
                  <p className="text-sm text-green-700">67% van gebruikers toont interesse in premium features</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
