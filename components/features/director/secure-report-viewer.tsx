"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Eye, Clock, Shield, AlertTriangle, Download } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { decrypt } from "@/lib/encryption"

interface SecureReportViewerProps {
  reportId: string
  directorId: string
  directorName: string
}

export function SecureReportViewer({ reportId, directorId, directorName }: SecureReportViewerProps) {
  const supabase = createClientComponentClient()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessExpiry, setAccessExpiry] = useState<Date | null>(null)
  const viewerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadReport()
    
    // Prevent right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // Prevent text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault()
      return false
    }

    // Prevent copy
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      return false
    }

    // Prevent print
    const handlePrint = (e: Event) => {
      e.preventDefault()
      alert("Printen is niet toegestaan voor vertrouwelijke rapporten")
      return false
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('selectstart', handleSelectStart)
    document.addEventListener('copy', handleCopy)
    window.addEventListener('beforeprint', handlePrint)

    // Prevent dev tools (basic protection)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault()
        return false
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('selectstart', handleSelectStart)
      document.removeEventListener('copy', handleCopy)
      window.removeEventListener('beforeprint', handlePrint)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const loadReport = async () => {
    try {
      // Check access permission
      const { data: access, error: accessError } = await supabase
        .from('report_access')
        .select('*, intake_reports(*)')
        .eq('report_id', reportId)
        .eq('director_id', directorId)
        .single()

      if (accessError || !access) {
        setError("U heeft geen toegang tot dit rapport")
        return
      }

      // Check if access has expired
      const expiryDate = new Date(access.expires_at)
      if (expiryDate < new Date()) {
        setError("Uw toegang tot dit rapport is verlopen")
        return
      }

      setAccessExpiry(expiryDate)

      // Update view count and timestamp
      await supabase
        .from('report_access')
        .update({
          viewed_at: new Date().toISOString(),
          view_count: (access.view_count || 0) + 1
        })
        .eq('id', access.id)

      // Decrypt report data
      const decryptedReport = JSON.parse(decrypt(access.intake_reports.report_data))
      setReport(decryptedReport)

    } catch (err) {
      console.error('Error loading report:', err)
      setError("Fout bij het laden van het rapport")
    } finally {
      setLoading(false)
    }
  }

  const renderWatermark = () => {
    return (
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 10 }}
      >
        {/* Diagonal watermarks */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-gray-200 text-2xl font-bold opacity-20 select-none"
            style={{
              top: `${i * 150}px`,
              left: '50%',
              transform: 'translateX(-50%) rotate(-45deg)',
              whiteSpace: 'nowrap'
            }}
          >
            VERTROUWELIJK - {directorName.toUpperCase()} - {new Date().toLocaleDateString('nl-NL')}
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Rapport laden...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="relative">
      {/* Security notice */}
      <Alert className="mb-4 border-purple-200 bg-purple-50">
        <Shield className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          <strong>Vertrouwelijk rapport</strong> - Dit rapport bevat persoonlijke informatie en mag niet worden gedeeld.
          Uw toegang verloopt op {accessExpiry?.toLocaleDateString('nl-NL')} om {accessExpiry?.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}.
        </AlertDescription>
      </Alert>

      {/* Report viewer */}
      <div 
        ref={viewerRef}
        className="relative bg-white rounded-lg shadow-lg overflow-hidden"
        style={{ userSelect: 'none' }}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
      >
        {renderWatermark()}
        
        <div className="relative z-20 p-8">
          {/* Report header */}
          <div className="mb-8 pb-6 border-b">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
                  Intake Rapport
                </h1>
                <p className="text-slate-600">
                  Gegenereerd op {new Date(report.generated_at).toLocaleDateString('nl-NL')} 
                  om {new Date(report.generated_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-purple-700 border-purple-300">
                  <Eye className="h-3 w-3 mr-1" />
                  Alleen-lezen
                </Badge>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  <Clock className="h-3 w-3 mr-1" />
                  Tijdelijke toegang
                </Badge>
              </div>
            </div>
          </div>

          {/* Family situation */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Familie Situatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Overledene</p>
                  <p className="font-medium">{report.family_situation.deceased_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Datum overlijden</p>
                  <p className="font-medium">
                    {new Date(report.family_situation.date_of_death).toLocaleDateString('nl-NL')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Relatie</p>
                  <p className="font-medium">{report.family_situation.relationship}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Urgentie</p>
                  <Badge variant={report.family_situation.urgency_level === 'high' ? 'destructive' : 'default'}>
                    {report.family_situation.urgency_level}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service preferences */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Service Voorkeuren</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Type uitvaart</p>
                  <p className="font-medium">{report.service_preferences.type}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Locatie</p>
                  <p className="font-medium">{report.service_preferences.location}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Verwacht aantal gasten</p>
                  <p className="font-medium">{report.service_preferences.expected_attendees}</p>
                </div>
              </div>
              
              {report.service_preferences.cultural_requirements.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-slate-600 mb-2">Culturele/Religieuze vereisten</p>
                  <div className="flex flex-wrap gap-2">
                    {report.service_preferences.cultural_requirements.map((req: string) => (
                      <Badge key={req} variant="secondary">{req}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial situation */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Financiële Situatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Uitvaartverzekering</p>
                  <p className="font-medium">
                    {report.financial_situation.has_insurance === 'yes' ? 'Ja' : 'Nee'}
                    {report.financial_situation.insurance_provider && 
                      ` - ${report.financial_situation.insurance_provider}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Geschat budget</p>
                  <p className="font-medium">
                    €{report.financial_situation.estimated_budget_range.min.toLocaleString('nl-NL')} - 
                    €{report.financial_situation.estimated_budget_range.max.toLocaleString('nl-NL')}
                  </p>
                </div>
              </div>
              
              {report.financial_situation.needs_financial_help !== 'no' && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Familie heeft financiële ondersteuning nodig: {report.financial_situation.needs_financial_help}
                    {report.financial_situation.gemeente && ` (Gemeente: ${report.financial_situation.gemeente})`}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Special requests */}
          {report.special_requests && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl">Speciale Verzoeken</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap">{report.special_requests}</p>
              </CardContent>
            </Card>
          )}

          {/* AI insights */}
          {report.conversation_insights && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl">AI Gespreksanalyse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Belangrijkste zorgen</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {report.conversation_insights.main_concerns.map((concern: string) => (
                      <Badge key={concern} variant="outline">{concern}</Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Emotionele staat</p>
                    <p className="font-medium">{report.conversation_insights.emotional_state}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Aantal vragen gesteld</p>
                    <p className="font-medium">{report.conversation_insights.questions_asked}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="mt-8 flex justify-end gap-3">
            <Button variant="outline" disabled>
              <Download className="h-4 w-4 mr-2" />
              Download (Uitgeschakeld)
            </Button>
            <Button 
              onClick={() => window.print()} 
              disabled
              variant="outline"
            >
              Printen (Uitgeschakeld)
            </Button>
          </div>
        </div>
      </div>

      {/* CSS for print prevention */}
      <style jsx global>{`
        @media print {
          body * {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}