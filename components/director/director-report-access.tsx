"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Shield, 
  FileText, 
  Clock, 
  Phone, 
  Mail, 
  Users, 
  AlertCircle,
  CheckCircle2,
  Heart,
  Eye,
  Calendar,
  MapPin,
  Euro
} from "lucide-react"

interface ReportAnalysis {
  familySituation: string
  funeralPreferences: string
  practicalPlanning: string
  communicationProfile: string
  directorRecommendations: string
  summary: string
  urgencyLevel: 'low' | 'medium' | 'high'
  preferredContact: 'phone' | 'email' | 'in_person'
  fullReport?: string
}

interface ReportData {
  id: string
  report_data: {
    analysis: ReportAnalysis
    generated_at: string
    version: string
  }
  created_at: string
}

interface AccessInfo {
  accessType: string
  expiresAt: string
  accessCount: number
}

export function DirectorReportAccess() {
  const [accessCode, setAccessCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null)
  const [error, setError] = useState("")

  const handleAccessReport = async () => {
    if (!accessCode.trim()) {
      setError("Voer een toegangscode in")
      return
    }

    setLoading(true)
    setError("")

    try {
      // DEMO MODE: Use demo API for demo codes
      const isDemoCode = accessCode.startsWith('DEMO-') || accessCode.startsWith('TEST-') || accessCode.startsWith('SAMPLE-')
      const apiUrl = isDemoCode ? 
        `/api/demo/director-access?code=${encodeURIComponent(accessCode)}` :
        `/api/generate-intake-report?code=${encodeURIComponent(accessCode)}`
      
      console.log(isDemoCode ? '🎭 Demo: Using demo director access' : '🔑 Real: Using production director access')
      
      const response = await fetch(apiUrl, {
        method: 'GET'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Toegang geweigerd')
      }

      setReportData(data.report)
      setAccessInfo(data.accessInfo)

    } catch (error) {
      console.error('Error accessing report:', error)
      setError(error instanceof Error ? error.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyInfo = (level: string) => {
    switch (level) {
      case 'high': 
        return { 
          label: 'Hoge Prioriteit', 
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: AlertCircle,
          description: 'Familie heeft urgente behoefte aan ondersteuning'
        }
      case 'medium': 
        return { 
          label: 'Gemiddelde Prioriteit', 
          color: 'text-orange-600 bg-orange-50 border-orange-200',
          icon: Clock,
          description: 'Normale planning en voorbereiding'
        }
      case 'low': 
        return { 
          label: 'Lage Prioriteit', 
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: CheckCircle2,
          description: 'Familie heeft tijd voor zorgvuldige planning'
        }
      default: 
        return { 
          label: 'Onbekend', 
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: Clock,
          description: 'Prioriteit niet bepaald'
        }
    }
  }

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'phone': return Phone
      case 'email': return Mail
      case 'in_person': return Users
      default: return Phone
    }
  }

  const getContactLabel = (type: string) => {
    switch (type) {
      case 'phone': return 'Telefonisch contact gewenst'
      case 'email': return 'E-mail contact gewenst'
      case 'in_person': return 'Persoonlijk gesprek gewenst'
      default: return 'Contact voorkeur onbekend'
    }
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-6">
          <div className="text-center mb-6">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Familierapport Toegang</h2>
            <p className="text-slate-600 text-sm">
              Voer de toegangscode in die u van de familie heeft ontvangen om hun uitvaartrapport te bekijken.
            </p>
            {/* DEMO MODE: Show demo instructions */}
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                🎭 <strong>Demo:</strong> Probeer codes: DEMO-123, TEST-456, SAMPLE-789
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="accessCode">Toegangscode</Label>
              <Input
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="FNR-XXXXX-XXXXX"
                className="mt-1 font-mono"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button 
              onClick={handleAccessReport}
              disabled={loading || !accessCode.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Toegang verkrijgen...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Rapport Bekijken
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 text-xs text-slate-500 space-y-1">
            <p>• Rapporten zijn vertrouwelijk en kunnen niet gedownload worden</p>
            <p>• Toegang wordt gelogd voor veiligheid</p>
            <p>• Codes verlopen automatisch na 30 dagen</p>
            <p>• 🎭 Demo codes werken voor test doeleinden</p>
          </div>
        </Card>
      </div>
    )
  }

  const analysis = reportData.report_data.analysis
  const urgencyInfo = getUrgencyInfo(analysis.urgencyLevel)
  const ContactIcon = getContactIcon(analysis.preferredContact)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* TODO PRODUCTION: Remove demo mode indicator from report header */}
        {reportData.isDemoMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-blue-600">🎭</span>
              <div>
                <span className="text-blue-800 font-medium">Demo Rapport</span>
                <span className="text-blue-700 text-sm ml-2">Dit is een voorbeeld rapport voor test doeleinden</span>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Familie Uitvaartrapport</h1>
            <p className="text-slate-600">
              Gegenereerd op {new Date(reportData.created_at).toLocaleDateString('nl-NL', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="text-right">
            <Badge className={`px-3 py-1 mb-2 ${urgencyInfo.color}`}>
              <urgencyInfo.icon className="h-3 w-3 mr-1" />
              {urgencyInfo.label}
            </Badge>
            <p className="text-xs text-slate-600">{urgencyInfo.description}</p>
          </div>
        </div>

        {/* Quick Overview */}
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-start gap-4">
            <Heart className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Samenvatting</h3>
              <p className="text-slate-700 mb-4">{analysis.summary}</p>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <ContactIcon className="h-4 w-4 text-slate-600" />
                  <span className="text-slate-600">{getContactLabel(analysis.preferredContact)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-slate-600" />
                  <span className="text-slate-600">Bekeken: {accessInfo?.accessCount || 1}x</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Familie Situatie */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Familie Situatie
            </h3>
            <p className="text-slate-700">{analysis.familySituation}</p>
          </Card>

          {/* Uitvaart Voorkeuren */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Uitvaart Voorkeuren
            </h3>
            <p className="text-slate-700">{analysis.funeralPreferences}</p>
          </Card>

          {/* Praktische Planning */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Praktische Planning
            </h3>
            <p className="text-slate-700">{analysis.practicalPlanning}</p>
          </Card>

          {/* Communicatie Profiel */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-orange-600" />
              Communicatie Profiel
            </h3>
            <p className="text-slate-700">{analysis.communicationProfile}</p>
          </Card>
        </div>

        {/* Aanbevelingen voor Uitvaartondernemer */}
        <Card className="p-6 border-l-4 border-l-green-500">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Aanbevelingen voor U als Uitvaartondernemer
          </h3>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-green-800">{analysis.directorRecommendations}</p>
          </div>
        </Card>

        {/* Access Information */}
        <Card className="p-4 bg-slate-50">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center gap-4">
              <span>Toegangscode: <code className="font-mono bg-white px-2 py-1 rounded">{accessCode}</code></span>
              <span>Verloopt: {new Date(accessInfo?.expiresAt || '').toLocaleDateString('nl-NL')}</span>
              {/* TODO PRODUCTION: Remove demo indicator */}
              {reportData.isDemoMode && (
                <span className="text-blue-600 text-xs bg-blue-100 px-2 py-1 rounded">Demo Mode</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Veilig bekeken via Funerally platform</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}