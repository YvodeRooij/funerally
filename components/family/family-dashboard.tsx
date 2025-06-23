"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  Users, 
  Euro,
  Heart,
  ArrowRight,
  Copy,
  Check,
  Shield,
  AlertCircle,
  Calendar,
  Video,
  Bell,
  MessageCircle,
  Send,
  CheckCheck,
  Edit3,
  Star,
  User,
  AlertTriangle,
  X
} from "lucide-react"
import { getServiceSupabaseClient } from "@/lib/supabase"
import { isDemoMode, getDemoReportData, createDemoSession } from "@/lib/demo-mode"
import { FamilyChatWidget } from "@/components/family/family-chat-widget"

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

interface Director {
  id: number
  name: string
  company: string
  rating: number
  phone: string
  email: string
  avatar?: string
}

interface ProcessStep {
  id: number
  title: string
  description: string
  status: 'completed' | 'in_progress' | 'pending'
  completedAt?: string
  urgentBy?: string
  selectedDirector?: Director
  dependsOn?: number[]
}

interface ServiceDetails {
  type: string
  location: string
  attendees: string
  budget: string
  culturalRequirements: string[]
  specialRequests: string[]
  insurance: {
    provider: string
    coverage: string
    status: string
  }
  transmissionStatus: 'ready' | 'sending' | 'completed' | 'modified'
  transmittedAt?: string
  modifiedAt?: string
}

interface DashboardData {
  intakeCompleted: boolean
  reportGenerated: boolean
  reportAnalysis?: ReportAnalysis
  accessCode?: string
  directorMatched: boolean
  directorContact?: Director
  processSteps: ProcessStep[]
  serviceDetails?: ServiceDetails
  documentsUploaded: number
  totalDocuments: number
  deceaseInfo?: {
    name: string
    dateOfDeath: string
    relationship: string
  }
  serviceDate?: string
  notifications: Array<{
    id: number
    type: 'urgent' | 'info'
    title: string
    message: string
    time: string
  }>
}

export function FamilyDashboard() {
  const { data: session } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [codeCopied, setCodeCopied] = useState(false)
  const [showChatWidget, setShowChatWidget] = useState(false)
  const [transmissionStatus, setTransmissionStatus] = useState<'ready' | 'sending' | 'completed' | 'modified'>('ready')
  const [isTransmitting, setIsTransmitting] = useState(false)
  const [showModifyDialog, setShowModifyDialog] = useState(false)
  
  // TODO PRODUCTION: Remove demo mode info
  const demoInfo = isDemoMode() ? 'Demo mode active - using mock data' : null

  useEffect(() => {
    // DEMO MODE: Use demo session if no real session
    if (session?.user?.id || isDemoMode()) {
      loadDashboardData()
    }
  }, [session])

  const loadDashboardData = useCallback(async () => {
    try {
      // TODO PRODUCTION: Remove demo mode - use only real database queries
      if (isDemoMode() && !session?.user?.id) {
        console.log('🎭 Demo: Loading demo dashboard data')
        const demoReport = getDemoReportData()
        
        // Create demo process steps
        const demoProcessSteps: ProcessStep[] = [
          {
            id: 1,
            title: "Persoonlijke gegevens",
            description: "Basisinformatie en contactgegevens",
            status: "completed",
            completedAt: "2024-01-16",
          },
          {
            id: 2,
            title: "Documenten uploaden",
            description: "Vereiste documenten en certificaten",
            status: "completed",
            completedAt: "2024-01-17",
          },
          {
            id: 3,
            title: "Uitvaartondernemer selecteren",
            description: "Kies en bevestig uw uitvaartondernemer",
            status: "completed",
            completedAt: "2024-01-18",
            selectedDirector: {
              id: 1,
              name: "Jan de Boer",
              company: "Uitvaartzorg Amsterdam",
              rating: 4.9,
              phone: "020-1234567",
              email: "j.deboer@uitvaartzorg.nl",
            },
          },
          {
            id: 4,
            title: "Gegevens verzenden",
            description: "Uitvaart details naar ondernemer verzenden",
            status: "in_progress",
            urgentBy: "2024-01-20",
          },
          {
            id: 5,
            title: "Ceremonie plannen",
            description: "Locatie, tijd en ceremonie details",
            status: "pending",
            dependsOn: [4],
          },
          {
            id: 6,
            title: "Financiële afhandeling",
            description: "Betalingen en verzekeringsclaims",
            status: "pending",
            dependsOn: [4, 5],
          },
        ]
        
        const demoServiceDetails: ServiceDetails = {
          type: "Crematie met plechtigheid",
          location: "Amsterdam Noord",
          attendees: "25-50 personen",
          budget: "€6,500 - €8,500",
          culturalRequirements: ["Christelijke tradities"],
          specialRequests: [
            "Favoriete muziek: 'Amazing Grace'",
            "Bloemen: Witte rozen en lelies",
            "Sprekers: Zoon Peter en dochter Anne",
            "Receptie na ceremonie gewenst",
          ],
          insurance: {
            provider: "DELA",
            coverage: "€5,000",
            status: "Bevestigd",
          },
          transmissionStatus: "ready",
        }
        
        setDashboardData({
          intakeCompleted: true,
          reportGenerated: true,
          reportAnalysis: demoReport.report_data.analysis,
          accessCode: 'DEMO-123',
          directorMatched: true,
          directorContact: demoProcessSteps[2].selectedDirector,
          processSteps: demoProcessSteps,
          serviceDetails: demoServiceDetails,
          documentsUploaded: 5,
          totalDocuments: 5,
          deceaseInfo: {
            name: "Henk van der Berg",
            dateOfDeath: "2024-01-15",
            relationship: "Echtgenote",
          },
          serviceDate: "2024-02-15",
          notifications: [
            {
              id: 1,
              type: "urgent",
              title: "Gegevens verzenden",
              message: "Verzend uw uitvaart details naar de ondernemer",
              time: "Nu",
            },
          ],
        })
        setLoading(false)
        return
      }
      
      // REAL MODE: Use actual database queries
      const supabase = getServiceSupabaseClient()

      // Get latest completed intake  
      // TODO: Replace demo user ID with real session user ID in production
      const userId = session?.user?.id || 'demo-family-123'
      const { data: intake } = await supabase
        .from('family_intakes')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      if (!intake) {
        setDashboardData({
          intakeCompleted: false,
          reportGenerated: false,
          directorMatched: false,
          processSteps: [],
          documentsUploaded: 0,
          totalDocuments: 5,
          notifications: [],
        })
        setLoading(false)
        return
      }

      // Get report data
      const { data: report } = await supabase
        .from('intake_reports')
        .select(`
          *,
          report_access(access_code, expires_at)
        `)
        .eq('intake_id', intake.id)
        .single()

      const reportAnalysis = report?.report_data?.analysis as ReportAnalysis
      const accessCode = report?.report_access?.[0]?.access_code

      // Create process steps based on current state
      const processSteps: ProcessStep[] = [
        {
          id: 1,
          title: "Persoonlijke gegevens",
          description: "Basisinformatie en contactgegevens",
          status: "completed",
          completedAt: intake.completed_at,
        },
        {
          id: 2,
          title: "Documenten uploaden",
          description: "Vereiste documenten en certificaten",
          status: "pending", // TODO: Check actual document status
        },
        {
          id: 3,
          title: "Uitvaartondernemer selecteren",
          description: "Kies en bevestig uw uitvaartondernemer",
          status: "pending", // TODO: Check if director selected
        },
        {
          id: 4,
          title: "Gegevens verzenden",
          description: "Uitvaart details naar ondernemer verzenden",
          status: "pending",
          dependsOn: [3],
        },
        {
          id: 5,
          title: "Ceremonie plannen",
          description: "Locatie, tijd en ceremonie details",
          status: "pending",
          dependsOn: [4],
        },
        {
          id: 6,
          title: "Financiële afhandeling",
          description: "Betalingen en verzekeringsclaims",
          status: "pending",
          dependsOn: [4, 5],
        },
      ]

      // Extract service details from intake data
      const intakeData = intake.intake_data as any
      const serviceDetails: ServiceDetails = {
        type: intakeData?.funeral_type || "Nog te bepalen",
        location: intakeData?.location || "Nog te bepalen",
        attendees: intakeData?.attendees || "Nog te bepalen",
        budget: intakeData?.budget || "Nog te bepalen",
        culturalRequirements: intakeData?.cultural_requirements || [],
        specialRequests: intakeData?.special_requests || [],
        insurance: {
          provider: intakeData?.insurance_provider || "Onbekend",
          coverage: intakeData?.insurance_coverage || "Onbekend",
          status: "Te controleren",
        },
        transmissionStatus: "ready",
      }

      const notifications = []
      if (report && !accessCode) {
        notifications.push({
          id: 1,
          type: "info" as const,
          title: "Toegangscode aanmaken",
          message: "Maak een toegangscode aan voor uw uitvaartondernemer",
          time: "Nu",
        })
      }

      setDashboardData({
        intakeCompleted: true,
        reportGenerated: !!report,
        reportAnalysis,
        accessCode,
        directorMatched: false, // TODO: Implement director matching
        processSteps,
        serviceDetails,
        documentsUploaded: 0, // TODO: Get from documents table
        totalDocuments: 5,
        notifications,
      })

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [session])

  const copyAccessCode = () => {
    if (dashboardData?.accessCode) {
      navigator.clipboard.writeText(dashboardData.accessCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  // TODO PRODUCTION: Remove demo delete function
  const handleDeleteReport = async () => {
    if (!isDemoMode()) return
    
    try {
      const response = await fetch('/api/demo/generate-report', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        console.log('🗑️ Demo report deleted')
        // Reset to no report state
        if (dashboardData) {
          setDashboardData({
            ...dashboardData,
            reportGenerated: false,
            reportAnalysis: undefined,
            accessCode: undefined,
          })
        }
      }
    } catch (error) {
      console.error('Error deleting demo report:', error)
    }
  }

  // Handle sending data to funeral home
  const handleSendToFuneralHome = async () => {
    setIsTransmitting(true)
    setTransmissionStatus('sending')

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setTransmissionStatus('completed')
    setIsTransmitting(false)

    // Update step status
    if (dashboardData) {
      const updatedSteps = dashboardData.processSteps.map(step => {
        if (step.id === 4) {
          return {
            ...step,
            status: 'completed' as const,
            completedAt: new Date().toISOString()
          }
        }
        return step
      })
      
      setDashboardData({
        ...dashboardData,
        processSteps: updatedSteps,
        serviceDetails: dashboardData.serviceDetails ? {
          ...dashboardData.serviceDetails,
          transmissionStatus: 'completed',
          transmittedAt: new Date().toISOString()
        } : undefined
      })
    }
  }

  // Handle modifying sent information
  const handleModifyInformation = () => {
    setTransmissionStatus('modified')
    if (dashboardData?.serviceDetails) {
      setDashboardData({
        ...dashboardData,
        serviceDetails: {
          ...dashboardData.serviceDetails,
          transmissionStatus: 'modified',
          modifiedAt: new Date().toISOString()
        }
      })
    }
    setShowModifyDialog(false)
  }

  // Handle resending modified information
  const handleResendInformation = async () => {
    setIsTransmitting(true)
    setTransmissionStatus('sending')

    await new Promise((resolve) => setTimeout(resolve, 2000))

    setTransmissionStatus('completed')
    setIsTransmitting(false)
    
    if (dashboardData?.serviceDetails) {
      setDashboardData({
        ...dashboardData,
        serviceDetails: {
          ...dashboardData.serviceDetails,
          transmissionStatus: 'completed',
          transmittedAt: new Date().toISOString()
        }
      })
    }
  }

  const getTransmissionButtonContent = () => {
    switch (transmissionStatus) {
      case 'sending':
        return (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Verzenden...
          </>
        )
      case 'completed':
        return (
          <>
            <CheckCheck className="h-4 w-4" />
            Verzonden
          </>
        )
      case 'modified':
        return (
          <>
            <Send className="h-4 w-4" />
            Wijzigingen verzenden
          </>
        )
      default:
        return (
          <>
            <Send className="h-4 w-4" />
            Verzend naar ondernemer
          </>
        )
    }
  }

  const currentStep = dashboardData?.processSteps.find(step => step.status === 'in_progress')
  const completedSteps = dashboardData?.processSteps.filter(step => step.status === 'completed').length || 0
  const totalSteps = dashboardData?.processSteps.length || 0
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  const selectedDirector = dashboardData?.processSteps.find(step => step.id === 3)?.selectedDirector || dashboardData?.directorContact
  const urgentNotifications = dashboardData?.notifications.filter(n => n.type === 'urgent').length || 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!dashboardData?.intakeCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-6 text-center">
          <Heart className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Welkom bij uw dashboard</h2>
          <p className="text-slate-600 mb-6">
            Complete eerst uw intake formulier om uw persoonlijke dashboard te activeren.
          </p>
          <Button 
            onClick={() => window.location.href = '/en/start'} 
            className="w-full"
          >
            Start Intake Formulier
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Clean Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                Uitvaart {dashboardData.deceaseInfo?.name || "Planning"}
              </h1>
              <p className="text-slate-600">
                {session?.user?.name || "Familie"} •{" "}
                {dashboardData.serviceDate ? new Date(dashboardData.serviceDate).toLocaleDateString("nl-NL") : "Datum te bepalen"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChatWidget(true)}
                className="text-slate-600 hover:text-slate-900 border-slate-300 bg-white hover:bg-slate-50"
              >
                <MessageCircle className="h-4 w-4" />
                Hulp
              </Button>
              {urgentNotifications > 0 && (
                <Button variant="outline" size="sm" className="relative border-slate-300 bg-white hover:bg-slate-50">
                  <Bell className="h-4 w-4" />
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                    {urgentNotifications}
                  </Badge>
                </Button>
              )}
            </div>
          </div>

          {/* Simple Progress */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Voortgang</span>
              <span className="text-sm text-slate-600">
                {completedSteps} van {totalSteps} stappen voltooid
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Process Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Proces overzicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {dashboardData.processSteps.map((step, index) => (
                    <div key={step.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step.status === "completed"
                              ? "bg-green-100 text-green-600"
                              : step.status === "in_progress"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {step.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <span className="text-sm font-medium">{step.id}</span>
                          )}
                        </div>
                        {index < dashboardData.processSteps.length - 1 && (
                          <div className="w-px h-12 bg-slate-200 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4
                            className={`font-medium ${
                              step.status === "completed"
                                ? "text-green-800"
                                : step.status === "in_progress"
                                  ? "text-blue-800"
                                  : "text-slate-600"
                            }`}
                          >
                            {step.title}
                          </h4>
                          {step.status === "completed" && step.completedAt && (
                            <span className="text-xs text-green-600">
                              {new Date(step.completedAt).toLocaleDateString("nl-NL")}
                            </span>
                          )}
                          {step.status === "in_progress" && step.urgentBy && (
                            <Badge variant="destructive" className="text-xs">
                              Voor {new Date(step.urgentBy).toLocaleDateString("nl-NL")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{step.description}</p>

                        {/* Integrated Send to Funeral Home for Step 4 */}
                        {step.id === 4 && step.status === "in_progress" && dashboardData.serviceDetails && (
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h5 className="font-medium text-blue-900">Klaar om te verzenden</h5>
                                <p className="text-sm text-blue-700">
                                  Uw uitvaart details naar {selectedDirector?.company || "ondernemer"}
                                </p>
                              </div>
                              {dashboardData.serviceDetails.transmissionStatus === "completed" && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCheck className="h-3 w-3 mr-1" />
                                  Verzonden
                                </Badge>
                              )}
                            </div>

                            {dashboardData.serviceDetails.transmissionStatus === "completed" && (
                              <div className="bg-white p-3 rounded border border-green-200 mb-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <CheckCheck className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-800">Succesvol verzonden</span>
                                </div>
                                <p className="text-xs text-green-700">
                                  Verzonden op{" "}
                                  {new Date(dashboardData.serviceDetails.transmittedAt || "").toLocaleString("nl-NL")}
                                </p>
                              </div>
                            )}

                            {dashboardData.serviceDetails.transmissionStatus === "modified" && (
                              <div className="bg-amber-50 p-3 rounded border border-amber-200 mb-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <Edit3 className="h-4 w-4 text-amber-600" />
                                  <span className="text-sm font-medium text-amber-800">Gegevens gewijzigd</span>
                                </div>
                                <p className="text-xs text-amber-700">
                                  Verzend de bijgewerkte gegevens naar de ondernemer
                                </p>
                              </div>
                            )}

                            <div className="flex items-center gap-3">
                              <Button
                                onClick={
                                  dashboardData.serviceDetails.transmissionStatus === "modified" 
                                    ? handleResendInformation 
                                    : handleSendToFuneralHome
                                }
                                disabled={isTransmitting}
                                className={
                                  dashboardData.serviceDetails.transmissionStatus === "completed"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : dashboardData.serviceDetails.transmissionStatus === "modified"
                                      ? "bg-amber-600 hover:bg-amber-700"
                                      : ""
                                }
                              >
                                {getTransmissionButtonContent()}
                              </Button>

                              {dashboardData.serviceDetails.transmissionStatus === "completed" && (
                                <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="hover:bg-slate-50">
                                      <Edit3 className="h-4 w-4" />
                                      Wijzigen
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Gegevens wijzigen</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <p className="text-sm text-slate-600">
                                        Weet u zeker dat u de verzonden gegevens wilt wijzigen? De uitvaartondernemer
                                        wordt op de hoogte gesteld van de wijzigingen.
                                      </p>
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          onClick={() => setShowModifyDialog(false)}
                                          className="hover:bg-slate-50"
                                        >
                                          Annuleren
                                        </Button>
                                        <Button onClick={handleModifyInformation} className="hover:bg-blue-700">
                                          Wijzigen
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Show selected director for step 3 */}
                        {step.id === 3 && step.status === "completed" && step.selectedDirector && (
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={step.selectedDirector.avatar || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {step.selectedDirector.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-green-900">{step.selectedDirector.name}</p>
                                <p className="text-xs text-green-700">{step.selectedDirector.company}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-green-700">{step.selectedDirector.rating}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service Details */}
            {dashboardData.serviceDetails && (
              <Card>
                <CardHeader>
                  <CardTitle>Uitvaart details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Heart className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-sm text-slate-600">Type uitvaart</p>
                          <p className="font-medium">{dashboardData.serviceDetails.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-sm text-slate-600">Gewenste locatie</p>
                          <p className="font-medium">{dashboardData.serviceDetails.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-sm text-slate-600">Aantal gasten</p>
                          <p className="font-medium">{dashboardData.serviceDetails.attendees}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Euro className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-sm text-slate-600">Budget</p>
                          <p className="font-medium">{dashboardData.serviceDetails.budget}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-sm text-slate-600">Verzekering</p>
                          <p className="font-medium">
                            {dashboardData.serviceDetails.insurance.provider} -{" "}
                            {dashboardData.serviceDetails.insurance.coverage}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Star className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-sm text-slate-600">Tradities</p>
                          <p className="font-medium">{dashboardData.serviceDetails.culturalRequirements.join(", ")}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium text-slate-900 mb-3">Speciale wensen</h4>
                    <div className="grid md:grid-cols-2 gap-2">
                      {dashboardData.serviceDetails.specialRequests.map((request, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{request}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Clean Sidebar */}
          <div className="space-y-6">
            {/* Selected Director */}
            {selectedDirector && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Uw ondernemer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedDirector.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {selectedDirector.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{selectedDirector.name}</h4>
                        <p className="text-sm text-slate-600">{selectedDirector.company}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-slate-600">{selectedDirector.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 hover:bg-blue-700">
                        <Phone className="h-4 w-4" />
                        Bellen
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 hover:bg-slate-50">
                        <Video className="h-4 w-4" />
                        Video
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documenten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    <Badge className={dashboardData.documentsUploaded === dashboardData.totalDocuments ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                      {dashboardData.documentsUploaded === dashboardData.totalDocuments ? "Compleet" : "In progress"}
                    </Badge>
                  </div>
                  <Progress value={(dashboardData.documentsUploaded / dashboardData.totalDocuments) * 100} className="h-2" />
                  <p className="text-xs text-slate-600">
                    {dashboardData.documentsUploaded}/{dashboardData.totalDocuments} documenten geüpload
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Important Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Belangrijke data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.deceaseInfo && (
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <Clock className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Overlijden</p>
                        <p className="font-medium">
                          {new Date(dashboardData.deceaseInfo.dateOfDeath).toLocaleDateString("nl-NL")}
                        </p>
                      </div>
                    </div>
                  )}
                  {dashboardData.serviceDate && (
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Uitvaart</p>
                        <p className="font-medium">
                          {new Date(dashboardData.serviceDate).toLocaleDateString("nl-NL")}
                        </p>
                      </div>
                    </div>
                  )}
                  {currentStep?.urgentBy && (
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Actie vereist voor</p>
                        <p className="font-medium text-red-800">
                          {new Date(currentStep.urgentBy).toLocaleDateString("nl-NL")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <FamilyChatWidget isOpen={showChatWidget} onClose={() => setShowChatWidget(false)} />
    </div>
  )
}