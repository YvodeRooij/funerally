"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { NewClientInvitationModal } from "@/components/director/new-client-invitation-modal"
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  ArrowRight,
  ArrowLeft,
  MapPin
} from "lucide-react"

interface ClientData {
  id: string
  familyName: string
  primaryContact: string
  phone: string
  email: string
  connectedAt: string
  lastActivity: string
  complianceStatus: 'ok' | 'warning' | 'urgent' | 'overdue'
  daysRemaining?: number
  hasReport: boolean
  reportType?: string
  municipality?: string
}

export function DirectorClientManager() {
  const [clients, setClients] = useState<ClientData[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<'all' | 'urgent' | 'ok'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false)

  // Mock director data - in production, get from auth context
  const directorInfo = {
    id: "dir-001",
    name: "Jan van der Berg"
  }

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    filterClients()
  }, [clients, searchTerm, filterStatus])

  const fetchClients = async () => {
    try {
      // Mock data integrating compliance status - Realistic 2-client example
      const mockClients: ClientData[] = [
        {
          id: "1",
          familyName: "Familie van der Berg",
          primaryContact: "Maria van der Berg",
          phone: "06-12345678",
          email: "maria@vandenberg.nl",
          connectedAt: "2025-06-28T10:00:00Z",
          lastActivity: "2025-07-01T14:30:00Z",
          complianceStatus: "urgent",
          daysRemaining: 0,
          hasReport: true,
          reportType: "Volledige intake rapport",
          municipality: "Amsterdam"
        },
        {
          id: "2", 
          familyName: "Familie Jansen",
          primaryContact: "Peter Jansen",
          phone: "06-87654321",
          email: "peter@jansen.nl",
          connectedAt: "2025-06-30T15:20:00Z",
          lastActivity: "2025-06-30T15:20:00Z",
          complianceStatus: "ok",
          daysRemaining: 4,
          hasReport: false,
          reportType: undefined,
          municipality: "Rotterdam"
        }
      ]
      
      setTimeout(() => {
        setClients(mockClients)
        setIsLoading(false)
      }, 500)
    } catch (error) {
      console.error('Error fetching clients:', error)
      setIsLoading(false)
    }
  }

  const filterClients = () => {
    let filtered = clients

    if (searchTerm) {
      filtered = filtered.filter(client => 
        client.familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.primaryContact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
      )
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'urgent') {
        filtered = filtered.filter(client => 
          client.complianceStatus === 'urgent' || client.complianceStatus === 'overdue'
        )
      } else if (filterStatus === 'ok') {
        filtered = filtered.filter(client => 
          client.complianceStatus === 'ok' || client.complianceStatus === 'warning'
        )
      }
    }

    setFilteredClients(filtered)
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
      case 'overdue': return 'Overschreden'
      case 'urgent': return 'Vandaag'
      case 'warning': return 'Morgen'
      default: return `${daysRemaining} dagen`
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

  const urgentCount = clients.filter(c => c.complianceStatus === 'urgent' || c.complianceStatus === 'overdue').length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-xl w-1/4 mb-8"></div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="h-10 bg-gray-200 rounded-xl w-1/3"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-16 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href="/director">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Cliënten</h1>
            <p className="text-gray-500 mt-1">
              {clients.length} families verbonden {urgentCount > 0 && `• ${urgentCount} hebben urgent aandacht nodig`}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setIsInvitationModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
        >
          <Plus className="mr-2 h-4 w-4" />
          Code genereren
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Zoek familie, naam of telefoon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-gray-200"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
              className="rounded-xl"
            >
              Alle
            </Button>
            <Button
              variant={filterStatus === 'urgent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('urgent')}
              className={`rounded-xl ${filterStatus === 'urgent' ? 'bg-red-600 hover:bg-red-700' : ''}`}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Urgent
            </Button>
            <Button
              variant={filterStatus === 'ok' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('ok')}
              className={`rounded-xl ${filterStatus === 'ok' ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Op schema
            </Button>
          </div>
        </div>
      </div>

      {/* Client Cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 mb-8">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{client.familyName}</h3>
                <p className="text-gray-500 text-sm">{client.primaryContact}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  client.complianceStatus === 'overdue' ? 'bg-red-100' :
                  client.complianceStatus === 'urgent' ? 'bg-orange-100' :
                  client.complianceStatus === 'warning' ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  {getStatusIcon(client.complianceStatus)}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <Badge className={`${getStatusColor(client.complianceStatus)} border rounded-xl`}>
                {getStatusText(client.complianceStatus, client.daysRemaining)}
              </Badge>
              {client.municipality && (
                <div className="flex items-center gap-1 mt-2">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{client.municipality}</span>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Phone className="h-3 w-3" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Mail className="h-3 w-3" />
                <span>{client.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Calendar className="h-3 w-3" />
                <span>Verbonden {new Date(client.connectedAt).toLocaleDateString('nl-NL')}</span>
              </div>
            </div>

            {/* Report Status */}
            {client.hasReport ? (
              <div className="bg-blue-50 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Rapport beschikbaar</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">{client.reportType}</p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Wacht op intake</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Familie moet nog rapport invullen</p>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild className="flex-1 rounded-xl">
                <Link href={`/director/clients/${client.id}`}>
                  <FileText className="h-3 w-3 mr-1" />
                  Bekijk
                </Link>
              </Button>
              
              {(client.complianceStatus === 'urgent' || client.complianceStatus === 'overdue') && (
                <Button size="sm" className="bg-red-600 hover:bg-red-700 rounded-xl">
                  <Phone className="h-3 w-3 mr-1" />
                  Bel nu
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && !isLoading && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Geen cliënten gevonden
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Probeer uw zoekopdracht aan te passen'
              : 'Genereer codes om families te verbinden'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Button 
              onClick={() => setIsInvitationModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" />
              Code genereren
            </Button>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="mr-2 h-5 w-5 text-gray-600" />
            Recente activiteit
          </h3>
          <p className="text-gray-500 text-sm mt-1">Laatste updates van uw cliënten</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-4 py-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Familie van der Berg</p>
              <p className="text-xs text-gray-500">Deadline vandaag • Amsterdam • Volledige intake beschikbaar</p>
            </div>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 rounded-xl" asChild>
              <Link href="/director/clients/1">
                <FileText className="h-3 w-3 mr-1" />
                Bekijk rapport
              </Link>
            </Button>
          </div>
          <div className="flex items-center space-x-4 py-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Familie Jansen</p>
              <p className="text-xs text-gray-500">Verbonden 1 dag geleden • Rotterdam • Wacht op intake</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-xl">
              <Phone className="h-3 w-3 mr-1" />
              Contact opnemen
            </Button>
          </div>
        </div>
      </div>

      {/* New Client Invitation Modal */}
      <NewClientInvitationModal
        isOpen={isInvitationModalOpen}
        onClose={() => setIsInvitationModalOpen(false)}
        directorId={directorInfo.id}
        directorName={directorInfo.name}
      />
    </div>
  )
}
