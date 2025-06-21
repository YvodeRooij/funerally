"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { CreditCard, Euro, CheckCircle, Clock, AlertCircle, Download, Receipt, Shield, TrendingUp } from "lucide-react"

// Mock payment data
const mockPayments = [
  {
    id: 1,
    description: "Platform diensten - Uitvaart Henk van der Berg",
    amount: 100,
    status: "paid",
    date: "2024-01-15",
    method: "iDEAL",
    invoiceNumber: "INV-2024-001",
    family: "Familie van der Berg",
  },
  {
    id: 2,
    description: "Uitvaartbegeleiding - Jan de Boer",
    amount: 2500,
    status: "pending",
    date: "2024-01-16",
    method: "Bankoverschrijving",
    invoiceNumber: "INV-2024-002",
    family: "Familie van der Berg",
  },
  {
    id: 3,
    description: "Locatie huur - Westgaarde Crematorium",
    amount: 450,
    status: "paid",
    date: "2024-01-14",
    method: "iDEAL",
    invoiceNumber: "INV-2024-003",
    family: "Familie van der Berg",
  },
  {
    id: 4,
    description: "Verzekering uitkering - DELA",
    amount: -3500,
    status: "received",
    date: "2024-01-12",
    method: "Bankoverschrijving",
    invoiceNumber: "DELA-2024-001",
    family: "Familie van der Berg",
  },
]

const mockInsurance = {
  provider: "DELA Verzekeringen",
  policyNumber: "DELA-123456789",
  coverage: 5000,
  claimed: 3500,
  remaining: 1500,
  status: "approved",
  claimDate: "2024-01-10",
  payoutDate: "2024-01-12",
}

const mockCostBreakdown = {
  platformFee: 100,
  directorFee: 2500,
  venueFee: 450,
  cateringFee: 800,
  flowersFee: 300,
  musicFee: 150,
  total: 4300,
  insurance: -3500,
  finalAmount: 800,
}

export function PaymentCenter() {
  const [activeTab, setActiveTab] = useState("overview")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "received":
        return "bg-blue-100 text-blue-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "received":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const totalPaid = mockPayments
    .filter((p) => p.status === "paid" && p.amount > 0)
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPending = mockPayments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)

  const totalReceived = mockPayments
    .filter((p) => p.status === "received")
    .reduce((sum, p) => sum + Math.abs(p.amount), 0)

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Betalingen</h1>
          <p className="text-slate-600">Overzicht van alle kosten en betalingen</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporteren
          </Button>
          <Button className="bg-purple-700 hover:bg-purple-800">
            <Receipt className="h-4 w-4 mr-2" />
            Factuur aanvragen
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Totaal betaald</p>
                <p className="text-2xl font-bold text-slate-900">€{totalPaid.toLocaleString()}</p>
                <p className="text-xs text-green-600">✓ Afgerond</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Nog te betalen</p>
                <p className="text-2xl font-bold text-slate-900">€{totalPending.toLocaleString()}</p>
                <p className="text-xs text-yellow-600">In behandeling</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Verzekering</p>
                <p className="text-2xl font-bold text-slate-900">€{totalReceived.toLocaleString()}</p>
                <p className="text-xs text-blue-600">Ontvangen</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Eigen bijdrage</p>
                <p className="text-2xl font-bold text-slate-900">€{mockCostBreakdown.finalAmount.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Eindtotaal</p>
              </div>
              <Euro className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="transactions">Transacties</TabsTrigger>
          <TabsTrigger value="insurance">Verzekering</TabsTrigger>
          <TabsTrigger value="breakdown">Kostenspecificatie</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Recente transacties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockPayments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(payment.status)}
                          <div>
                            <p className="font-medium text-slate-900">{payment.description}</p>
                            <p className="text-sm text-slate-600">
                              {new Date(payment.date).toLocaleDateString("nl-NL")} • {payment.method}
                            </p>
                            <p className="text-xs text-slate-500">{payment.invoiceNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${payment.amount > 0 ? "text-red-600" : "text-green-600"}`}>
                            {payment.amount > 0 ? "-" : "+"}€{Math.abs(payment.amount).toLocaleString()}
                          </p>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status === "paid"
                              ? "Betaald"
                              : payment.status === "pending"
                                ? "In behandeling"
                                : payment.status === "received"
                                  ? "Ontvangen"
                                  : "Achterstallig"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Payment Status */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Betalingsstatus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-green-700">Verzekering</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Platform kosten</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Locatie</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Uitvaartondernemer</span>
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insurance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Verzekering
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-slate-900">{mockInsurance.provider}</p>
                      <p className="text-sm text-slate-600">Polis: {mockInsurance.policyNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Dekking</span>
                        <span>€{mockInsurance.coverage.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Uitgekeerd</span>
                        <span className="text-green-600">€{mockInsurance.claimed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Resterend</span>
                        <span>€{mockInsurance.remaining.toLocaleString()}</span>
                      </div>
                    </div>
                    <Progress value={(mockInsurance.claimed / mockInsurance.coverage) * 100} className="h-2" />
                  </div>
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
                    Facturen downloaden
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Receipt className="h-4 w-4 mr-2" />
                    Betalingsbewijs
                  </Button>
                  <Button className="w-full" variant="outline">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Betaalmethode wijzigen
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Alle transacties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="font-medium text-slate-900">{payment.description}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(payment.date).toLocaleDateString("nl-NL")} • {payment.method}
                        </p>
                        <p className="text-xs text-slate-500">
                          {payment.invoiceNumber} • {payment.family}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${payment.amount > 0 ? "text-red-600" : "text-green-600"}`}>
                        {payment.amount > 0 ? "-" : "+"}€{Math.abs(payment.amount).toLocaleString()}
                      </p>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status === "paid"
                          ? "Betaald"
                          : payment.status === "pending"
                            ? "In behandeling"
                            : payment.status === "received"
                              ? "Ontvangen"
                              : "Achterstallig"}
                      </Badge>
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Receipt className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verzekeringsinformatie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Verzekeraar</h4>
                    <p className="text-slate-600">{mockInsurance.provider}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Polisnummer</h4>
                    <p className="text-slate-600">{mockInsurance.policyNumber}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Status</h4>
                    <Badge className="bg-green-100 text-green-800">Goedgekeurd</Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Claim datum</h4>
                    <p className="text-slate-600">{new Date(mockInsurance.claimDate).toLocaleDateString("nl-NL")}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Uitbetaling datum</h4>
                    <p className="text-slate-600">{new Date(mockInsurance.payoutDate).toLocaleDateString("nl-NL")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dekking overzicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Totale dekking</span>
                    <span className="font-semibold">€{mockInsurance.coverage.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Uitgekeerd</span>
                    <span className="font-semibold text-green-600">€{mockInsurance.claimed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Resterend</span>
                    <span className="font-semibold">€{mockInsurance.remaining.toLocaleString()}</span>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Gebruikt</span>
                      <span>{Math.round((mockInsurance.claimed / mockInsurance.coverage) * 100)}%</span>
                    </div>
                    <Progress value={(mockInsurance.claimed / mockInsurance.coverage) * 100} className="h-3" />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Goed nieuws:</strong> U heeft nog €{mockInsurance.remaining.toLocaleString()} dekking
                      beschikbaar voor eventuele extra kosten.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Gedetailleerde kostenspecificatie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Cost Breakdown */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4">Kostenopbouw</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">Platform diensten</span>
                      <span className="font-medium">€{mockCostBreakdown.platformFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">Uitvaartbegeleiding</span>
                      <span className="font-medium">€{mockCostBreakdown.directorFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">Locatie huur</span>
                      <span className="font-medium">€{mockCostBreakdown.venueFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">Catering</span>
                      <span className="font-medium">€{mockCostBreakdown.cateringFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">Bloemen</span>
                      <span className="font-medium">€{mockCostBreakdown.flowersFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">Muziek</span>
                      <span className="font-medium">€{mockCostBreakdown.musicFee.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center py-3 border-t-2 border-slate-300">
                      <span className="font-semibold text-slate-900">Subtotaal</span>
                      <span className="font-semibold text-lg">€{mockCostBreakdown.total.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-green-600">Verzekering uitkering</span>
                      <span className="font-medium text-green-600">
                        -€{Math.abs(mockCostBreakdown.insurance).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-3 border-t-2 border-slate-300 bg-slate-50 px-4 rounded-lg">
                      <span className="font-bold text-slate-900 text-lg">Eindtotaal</span>
                      <span className="font-bold text-xl text-purple-600">
                        €{mockCostBreakdown.finalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Savings Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Uw besparingen
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Transparante prijzen</span>
                      <span className="text-green-800 font-medium">€400 bespaard</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Directe verzekering afhandeling</span>
                      <span className="text-green-800 font-medium">€200 bespaard</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Geen tussenpersonen</span>
                      <span className="text-green-800 font-medium">€300 bespaard</span>
                    </div>
                    <div className="border-t border-green-300 pt-2 mt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-green-800">Totaal bespaard</span>
                        <span className="font-bold text-green-800">€900</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
