"use client"

/**
 * Dutch Legal Compliance Widget for Director Dashboard
 *
 * Shows specific clients requiring action under Dutch funeral law
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle, Calendar, User, Phone, FileText, Info, Clock, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"

interface ClientComplianceItem {
  id: string
  clientName: string
  deathDate: string
  burialDate: string
  daysRemaining: number
  status: "ok" | "warning" | "urgent" | "overdue"
  nextAction: string
  actionBy: string
  municipality: string
  permitRequired: boolean
}

interface ComplianceData {
  clients: ClientComplianceItem[]
  totalActive: number
  overdueCount: number
  urgentCount: number
}

export function DutchLegalComplianceWidget() {
  const [data, setData] = useState<ComplianceData>({
    clients: [],
    totalActive: 0,
    overdueCount: 0,
    urgentCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const fetchComplianceData = async () => {
      try {
        const response = await fetch('/api/dutch-compliance/dashboard')
        const result = await response.json()
        
        if (result.success) {
          setData(result.data)
        } else {
          console.error('Failed to fetch compliance data:', result.error)
          // Fall back to empty state
          setData({
            clients: [],
            totalActive: 0,
            overdueCount: 0,
            urgentCount: 0
          })
        }
      } catch (error) {
        console.error('Error fetching compliance data:', error)
        // Fall back to empty state
        setData({
          clients: [],
          totalActive: 0,
          overdueCount: 0,
          urgentCount: 0
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchComplianceData()
  }, [])

  const urgentClients = data.clients.filter((c) => c.status === "urgent" || c.status === "overdue")
  const needsAttention = urgentClients.length > 0

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Deadlines</h3>
            <p className="text-sm text-gray-500 mt-1">Nederlandse uitvaart termijnen</p>
          </div>
          {needsAttention && (
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!needsAttention ? (
          // All good state
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="text-base font-medium text-gray-900 mb-2">Alles op schema</h4>
            <p className="text-sm text-gray-500">{data.totalActive} actieve zaken binnen termijn</p>
          </div>
        ) : (
          // Needs attention state
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-medium text-gray-900">
                {urgentClients.length} {urgentClients.length === 1 ? 'zaak heeft' : 'zaken hebben'} aandacht nodig
              </h4>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600 hover:text-blue-700"
              >
                {showDetails ? 'Verberg' : 'Bekijk'}
              </Button>
            </div>

            {showDetails && (
              <div className="space-y-3 mt-4">
                {urgentClients.map((client) => (
                  <div key={client.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-medium text-gray-900">{client.clientName}</h5>
                        <p className="text-sm text-gray-500">{client.municipality}</p>
                      </div>
                      {client.status === "overdue" && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-md">
                          Te laat
                        </span>
                      )}
                      {client.status === "urgent" && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-md">
                          Vandaag
                        </span>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">Volgende stap:</p>
                      <p className="text-sm text-gray-700">{client.nextAction}</p>
                    </div>

                    <Button 
                      size="sm" 
                      className={`w-full ${client.status === "overdue" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
                      asChild
                    >
                      <Link href={`/director/clients/${client.id}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        {client.status === "overdue" ? "Gemeente nu bellen" : "Actie nemen"}
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {!showDetails && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {urgentClients.slice(0, 2).map((client) => (
                  <div key={client.id} className="p-3 border border-gray-200 rounded-lg">
                    <p className="font-medium text-sm text-gray-900 truncate">{client.clientName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {client.status === "overdue" ? "Deadline overschreden" : "Deadline vandaag"}
                    </p>
                  </div>
                ))}
                {urgentClients.length > 2 && (
                  <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-sm text-gray-500">+{urgentClients.length - 2} meer</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
