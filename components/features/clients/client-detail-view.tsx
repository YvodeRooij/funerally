"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft,
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle,
  Shield,
  Heart,
  Info,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import Link from "next/link"

interface ClientData {
  id: string
  familyName: string
  primaryContact: string
  phone: string
  email: string
  municipality: string
  connectedAt: string
  complianceStatus: 'ok' | 'warning' | 'urgent' | 'overdue'
  daysRemaining?: number
  hasReport: boolean
  reportData?: FamilyReport
}

interface FamilyReport {
  executiveSummary: string
  familySituation: string
  funeralPreferences: string
  urgencyLevel: 'low' | 'medium' | 'high'
  preferredContact: 'phone' | 'email' | 'in_person'
  practicalPlanning: string
  communicationProfile: string
  directorRecommendations: string
  completedAt: string
}

interface ClientDetailViewProps {
  clientId: string
}

export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  const [client, setClient] = useState<ClientData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true, // Always expanded
    recommendations: true, // Always expanded by default
    family: false,
    preferences: false,
    planning: false,
    communication: false
  })

  useEffect(() => {
    fetchClientData()
  }, [clientId])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const fetchClientData = async () => {
    try {
      // Mock data based on clientId - in production this would fetch from API
      const mockClients: Record<string, ClientData> = {
        "1": {
          id: "1",
          familyName: "Familie van der Berg",
          primaryContact: "Maria van der Berg",
          phone: "06-12345678",
          email: "maria@vandenberg.nl",
          municipality: "Amsterdam",
          connectedAt: "2025-06-28T10:00:00Z",
          complianceStatus: "urgent",
          daysRemaining: 0,
          hasReport: true,
          reportData: {
            executiveSummary: "Familie van der Berg heeft onlangs hun vader verloren en zoekt een waardige, traditionele uitvaart in Amsterdam. De familie heeft sterke voorkeur voor een klassieke ceremonie met muzikale elementen. Urgentie is hoog vanwege de Nederlandse 6-dagen termijn.",
            familySituation: "Maria van der Berg (dochter) is hoofdcontactpersoon voor de familie. Vader Henk van der Berg (78) overleed onverwacht aan een hartaanval. Familie bestaat uit 3 kinderen en 8 kleinkinderen. Moeder leeft nog maar heeft dementie. Familie is hecht en wil samen beslissingen nemen.",
            funeralPreferences: "Traditionele uitvaart in Amsterdam. Voorkeur voor crematie met aansluitend familiebijeenkomst. Muziek is zeer belangrijk - klassieke stukken en een specifiek lied dat vader belangrijk vond. Geen bloemen, wel donaties aan hartstichting.",
            urgencyLevel: "high",
            preferredContact: "phone",
            practicalPlanning: "Uitvaart gepland voor vrijdag 7 juli in Crematorium Westgaarde Amsterdam. Verwacht 50-75 gasten. Familie regelt zelf catering na ceremonie. Speciale aandacht voor toegankelijkheid voor oudere familieleden.",
            communicationProfile: "Maria communiceert namens de familie en prefereert telefooncontact voor belangrijke zaken. Familie waardeert directe, empathische communicatie. Broer Peter helpt met praktische zaken.",
            directorRecommendations: "1) Prioriteit op muziekregeling - contact opnemen met organist. 2) Extra aandacht voor moeder met dementie tijdens ceremonie. 3) Flexibiliteit in timing vanwege grote familie. 4) Bespreken van Nederlandse wetgeving omtrent 6-dagen termijn.",
            completedAt: "2025-07-01T11:30:00Z"
          }
        },
        "2": {
          id: "2",
          familyName: "Familie Jansen",
          primaryContact: "Peter Jansen",
          phone: "06-87654321",
          email: "peter@jansen.nl",
          municipality: "Rotterdam",
          connectedAt: "2025-06-30T15:20:00Z",
          complianceStatus: "ok",
          daysRemaining: 4,
          hasReport: false
        }
      }

      setTimeout(() => {
        setClient(mockClients[clientId] || null)
        setIsLoading(false)
      }, 500)
    } catch (error) {
      console.error('Error fetching client data:', error)
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'urgent': return <Clock className="h-4 w-4 text-orange-600" />
      case 'warning': return <Calendar className="h-4 w-4 text-yellow-600" />
      default: return <CheckCircle className="h-4 w-4 text-green-600" />
    }
  }

  const getStatusText = (status: string, daysRemaining?: number) => {
    switch (status) {
      case 'overdue': return 'Deadline overschreden'
      case 'urgent': return 'Deadline vandaag'
      case 'warning': return 'Deadline morgen'
      default: return `${daysRemaining} dagen resterend`
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200'
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Cliënt niet gevonden</h2>
        <p className="text-gray-500 mb-4">De opgevraagde cliënt kon niet worden gevonden.</p>
        <Button className="rounded-xl" asChild>
          <Link href="/director/clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar cliënten
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href="/director/clients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar cliënten
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.familyName}</h1>
            <p className="text-muted-foreground">Cliënt details en rapport</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="rounded-xl">
            <Phone className="mr-2 h-4 w-4" />
            {client.phone}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">
            <MessageSquare className="mr-2 h-4 w-4" />
            Bericht sturen
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Nederlandse Wetgeving</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(client.complianceStatus)}
              <Badge className={`${getStatusColor(client.complianceStatus)} border`}>
                {getStatusText(client.complianceStatus, client.daysRemaining)}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mb-3">6-dagen termijn</p>
            {(client.complianceStatus === 'urgent' || client.complianceStatus === 'overdue') && (
              <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 rounded-xl">
                <Phone className="h-3 w-3 mr-1" />
                Bel nu
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Rapport Status</CardTitle>
          </CardHeader>
          <CardContent>
            {client.hasReport ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <Badge className="bg-green-100 text-green-800">Voltooid</Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <Badge className="bg-orange-100 text-orange-800">Wacht op intake</Badge>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {client.hasReport ? 'Familie heeft rapport ingevuld' : 'Familie moet nog intake doen'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 mb-3">
              <p className="text-sm font-medium">{client.primaryContact}</p>
              <p className="text-xs text-gray-500">{client.email}</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="flex-1 rounded-xl">
                <Phone className="h-3 w-3 mr-1" />
                Bel
              </Button>
              <Button size="sm" variant="outline" className="flex-1 rounded-xl">
                <Mail className="h-3 w-3 mr-1" />
                Mail
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Locatie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-sm">{client.municipality}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Verbonden {new Date(client.connectedAt).toLocaleDateString('nl-NL')}
            </p>
            <Button size="sm" variant="outline" className="w-full rounded-xl">
              <Calendar className="h-3 w-3 mr-1" />
              Plan afspraak
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps Widget - Always Visible */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Volgende stappen
            {(client.complianceStatus === 'urgent' || client.complianceStatus === 'overdue') && (
              <Badge className="bg-red-100 text-red-800 border-red-200">Urgent</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {client.complianceStatus === 'urgent' 
              ? 'Deadline vandaag - actie vereist'
              : client.complianceStatus === 'overdue'
              ? 'Deadline overschreden - onmiddellijke actie vereist'
              : 'Prioriteitsacties voor deze cliënt'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {client.complianceStatus === 'urgent' || client.complianceStatus === 'overdue' ? (
              <>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-900">Bel familie urgente planning</p>
                      <p className="text-xs text-red-700">Nederlandse wetgeving vereist actie vandaag</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 rounded-xl">
                    <Phone className="h-3 w-3 mr-1" />
                    Bel nu
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-900">Documenten voorbereiden gemeente</p>
                      <p className="text-xs text-orange-700">Voor {client.municipality} aanmelding</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl">
                    <Calendar className="h-3 w-3 mr-1" />
                    Plan
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {client.hasReport ? 'Bevestig ontvangst rapport' : 'Volg intake voortgang op'}
                      </p>
                      <p className="text-xs text-blue-700">
                        {client.hasReport ? 'Laat familie weten dat rapport ontvangen is' : 'Familie moet nog intake voltooien'}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Contact
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-900">Plan voorbereidingsgesprek</p>
                      <p className="text-xs text-green-700">Afspraak in {client.municipality}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl">
                    <Calendar className="h-3 w-3 mr-1" />
                    Plannen
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {client.hasReport && client.reportData ? (
        <Tabs defaultValue="report" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="report">📋 Intake Rapport</TabsTrigger>
            <TabsTrigger value="timeline">📅 Tijdlijn</TabsTrigger>
            <TabsTrigger value="documents">📁 Documenten</TabsTrigger>
            <TabsTrigger value="actions">⚡ Acties</TabsTrigger>
          </TabsList>

          <TabsContent value="report">
            <div className="space-y-4">
              {/* Executive Summary - Always Expanded */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-blue-600" />
                    Samenvatting
                    <Badge className={`ml-auto ${getUrgencyColor(client.reportData.urgencyLevel)}`}>
                      {client.reportData.urgencyLevel === 'high' ? 'Hoge urgentie' : 
                       client.reportData.urgencyLevel === 'medium' ? 'Gemiddelde urgentie' : 'Lage urgentie'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Key highlights as bullet points for better scanning */}
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Hoofdpunten:</p>
                      <ul className="space-y-1 text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-sm">Familie van der Berg zoekt waardige, traditionele uitvaart in Amsterdam</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-sm">Sterke voorkeur voor klassieke ceremonie met muzikale elementen</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-sm font-medium text-orange-700">Hoge urgentie vanwege Nederlandse 6-dagen termijn</span>
                        </li>
                      </ul>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                      <p className="text-sm text-blue-800">
                        <strong>Voorkeur contact:</strong> {
                          client.reportData.preferredContact === 'phone' ? 'Telefoon' :
                          client.reportData.preferredContact === 'email' ? 'E-mail' : 'Persoonlijk gesprek'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Family Situation - Collapsible */}
              <Card>
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 rounded-t-lg transition-colors"
                  onClick={() => toggleSection('family')}
                >
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-green-600" />
                    Familiesituatie
                    {expandedSections.family ? 
                      <ChevronDown className="h-4 w-4 ml-auto text-gray-400" /> : 
                      <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                    }
                  </CardTitle>
                </CardHeader>
                {expandedSections.family && (
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Familie structuur:</p>
                        <ul className="space-y-1 text-gray-700">
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm">Maria van der Berg (dochter) - hoofdcontactpersoon</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm">Henk van der Berg (78) - overledene na hartaanval</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm">3 kinderen, 8 kleinkinderen - hechte familie</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm">Moeder leeft nog maar heeft dementie</span>
                          </li>
                        </ul>
                      </div>
                      <div className="p-3 bg-green-50 rounded-xl">
                        <p className="text-sm text-green-800">
                          <strong>Besluitvorming:</strong> Familie wil samen beslissingen nemen
                        </p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Funeral Preferences - Collapsible */}
              <Card>
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 rounded-t-lg transition-colors"
                  onClick={() => toggleSection('preferences')}
                >
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Uitvaartwensen
                    {expandedSections.preferences ? 
                      <ChevronDown className="h-4 w-4 ml-auto text-gray-400" /> : 
                      <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                    }
                  </CardTitle>
                </CardHeader>
                {expandedSections.preferences && (
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Ceremonie voorkeuren:</p>
                        <ul className="space-y-1 text-gray-700">
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm">Traditionele uitvaart in Amsterdam</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm">Voorkeur voor crematie met aansluitend familiebijeenkomst</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm font-medium">Muziek is zeer belangrijk - klassieke stukken</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm">Geen bloemen, wel donaties aan hartstichting</span>
                          </li>
                        </ul>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-xl">
                        <p className="text-sm text-purple-800">
                          <strong>Specifiek lied:</strong> Vader had een belangrijk lied dat gespeeld moet worden
                        </p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Practical Planning */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-orange-600" />
                    Praktische Planning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{client.reportData.practicalPlanning}</p>
                </CardContent>
              </Card>

              {/* Director Recommendations - Always Expanded & Priority */}
              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-yellow-600" />
                    Aanbevelingen voor u
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Prioriteit</Badge>
                  </CardTitle>
                  <CardDescription>Direct uitvoerbare acties op basis van familie-intake</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-200">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-red-700">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">Prioriteit op muziekregeling - contact opnemen met organist</p>
                        <p className="text-xs text-red-700 mt-1">Klassieke stukken en specifiek lied vader belangrijk vond</p>
                      </div>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 rounded-xl">
                        <Phone className="h-3 w-3 mr-1" />
                        Bel organist
                      </Button>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-orange-700">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-orange-900">Extra aandacht voor moeder met dementie tijdens ceremonie</p>
                        <p className="text-xs text-orange-700 mt-1">Speciale begeleiding en toegankelijkheid arrangeren</p>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-xl">
                        <User className="h-3 w-3 mr-1" />
                        Plan zorg
                      </Button>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-700">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">Flexibiliteit in timing vanwege grote familie</p>
                        <p className="text-xs text-blue-700 mt-1">50-75 gasten verwacht, rekening houden met gezamenlijke besluitvorming</p>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-xl">
                        <Calendar className="h-3 w-3 mr-1" />
                        Plan timing
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Communication Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Communicatieprofiel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{client.reportData.communicationProfile}</p>
                </CardContent>
              </Card>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Dit rapport is automatisch gegenereerd op basis van de familie intake op{' '}
                  {new Date(client.reportData.completedAt).toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Activiteiten tijdlijn</CardTitle>
                <CardDescription>Chronologisch overzicht van alle activiteiten</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Intake rapport voltooid</p>
                      <p className="text-xs text-muted-foreground">Familie heeft volledige intake ingevuld</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(client.reportData.completedAt).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Familie verbonden</p>
                      <p className="text-xs text-muted-foreground">Verbonden via director code</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(client.connectedAt).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documenten</CardTitle>
                <CardDescription>Alle documenten van deze familie</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Intake Rapport.pdf</p>
                        <p className="text-xs text-muted-foreground">
                          Voltooid {new Date(client.reportData.completedAt).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      Download
                    </Button>
                  </div>
                  <div className="text-center py-6 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Meer documenten worden beschikbaar als de familie deze uploadt</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Volgende stappen</CardTitle>
                  <CardDescription>Acties die u kunt ondernemen voor deze familie</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start rounded-xl bg-blue-600 hover:bg-blue-700" size="lg">
                    <Phone className="h-4 w-4 mr-3" />
                    Bel familie voor urgente planning
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-xl" size="lg">
                    <Calendar className="h-4 w-4 mr-3" />
                    Plan afspraak in Amsterdam
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-xl" size="lg">
                    <MessageSquare className="h-4 w-4 mr-3" />
                    Stuur bevestiging van ontvangst
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-xl" size="lg">
                    <FileText className="h-4 w-4 mr-3" />
                    Genereer offerte
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // No Report Available
        <Card className="text-center py-12">
          <CardContent>
            <Clock className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Wacht op intake rapport
            </h3>
            <p className="text-gray-500 mb-6">
              {client.familyName} is verbonden maar heeft nog geen intake rapport ingevuld.
            </p>
            <div className="space-y-3">
              <Button className="w-full max-w-sm rounded-xl bg-blue-600 hover:bg-blue-700">
                <Phone className="h-4 w-4 mr-2" />
                Bel {client.primaryContact}
              </Button>
              <Button variant="outline" className="w-full max-w-sm rounded-xl">
                <MessageSquare className="h-4 w-4 mr-2" />
                Stuur reminder voor intake
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
