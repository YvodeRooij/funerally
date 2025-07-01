"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Clock, 
  Mail, 
  Copy, 
  RefreshCw, 
  X, 
  Phone, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Eye
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { directorCodeService } from "@/lib/services/director-code-service"

interface PendingInvitation {
  id: string
  code: string
  familyName: string
  primaryContact: string
  email: string
  phone: string
  status: 'pending' | 'connected' | 'completed' | 'expired'
  createdAt: string
  expiresAt: string
  connectedAt?: string
}

interface PendingInvitationsWidgetProps {
  directorId: string
  onInvitationUpdate?: () => void
}

export function PendingInvitationsWidget({ directorId, onInvitationUpdate }: PendingInvitationsWidgetProps) {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchInvitations()
  }, [directorId])

  const fetchInvitations = async () => {
    setIsLoading(true)
    try {
      const data = await directorCodeService.getPendingInvitations(directorId)
      setInvitations(data)
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    setActionLoading(invitationId)
    try {
      // Simulate resending email
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update invitation timestamp
      setInvitations(prev => prev.map(inv => 
        inv.id === invitationId 
          ? { ...inv, createdAt: new Date().toISOString() }
          : inv
      ))
      
      console.log(`Resent invitation for ${invitationId}`)
      onInvitationUpdate?.()
    } catch (error) {
      console.error('Error resending invitation:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    setActionLoading(invitationId)
    try {
      // Simulate canceling invitation
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Remove invitation from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
      
      console.log(`Canceled invitation for ${invitationId}`)
      onInvitationUpdate?.()
    } catch (error) {
      console.error('Error canceling invitation:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const copyCodeToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      console.log('Code copied to clipboard')
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  const getStatusBadge = (invitation: PendingInvitation) => {
    const now = new Date()
    const expiresAt = new Date(invitation.expiresAt)
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (invitation.status === 'connected') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Verbonden</Badge>
    }
    
    if (invitation.status === 'expired' || daysUntilExpiry <= 0) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Verlopen</Badge>
    }
    
    if (daysUntilExpiry <= 3) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Verloopt binnenkort</Badge>
    }
    
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Wacht op familie</Badge>
  }

  const getDaysRemaining = (expiresAt: string): number => {
    const now = new Date()
    const expires = new Date(expiresAt)
    return Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getTimeAgo = (dateString: string): string => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Zojuist'
    if (diffInHours < 24) return `${diffInHours}u geleden`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} dag${diffInDays !== 1 ? 'en' : ''} geleden`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Uitnodigingen in behandeling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending')
  const expiringSoon = invitations.filter(inv => {
    const daysRemaining = getDaysRemaining(inv.expiresAt)
    return daysRemaining <= 3 && daysRemaining > 0 && inv.status === 'pending'
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          Uitnodigingen in behandeling
          {pendingInvitations.length > 0 && (
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
              {pendingInvitations.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Codes verstuurd naar families, wachtend op reactie
        </CardDescription>
      </CardHeader>
      <CardContent>
        {expiringSoon.length > 0 && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {expiringSoon.length} uitnodiging{expiringSoon.length !== 1 ? 'en' : ''} verlopen binnenkort
            </AlertDescription>
          </Alert>
        )}

        {pendingInvitations.length === 0 ? (
          <div className="text-center py-6">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Geen openstaande uitnodigingen</p>
            <p className="text-xs text-gray-400 mt-1">
              Nieuwe codes verschijnen hier zodra ze verstuurd zijn
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => {
              const daysRemaining = getDaysRemaining(invitation.expiresAt)
              
              return (
                <div key={invitation.id} className="p-4 border rounded-xl bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{invitation.familyName}</h4>
                        {getStatusBadge(invitation)}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{invitation.primaryContact}</span>
                          <span className="text-gray-400">•</span>
                          <span>{invitation.email}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span>Verzonden {getTimeAgo(invitation.createdAt)}</span>
                          <span className="text-gray-400">•</span>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {invitation.code}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span className={daysRemaining <= 3 ? 'text-orange-600 font-medium' : ''}>
                            {daysRemaining > 0 
                              ? `${daysRemaining} dag${daysRemaining !== 1 ? 'en' : ''} resterend`
                              : 'Verlopen'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyCodeToClipboard(invitation.code)}
                        className="rounded-xl"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading === invitation.id}
                            className="rounded-xl"
                          >
                            {actionLoading === invitation.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <MoreVertical className="h-3 w-3" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleResendInvitation(invitation.id)}
                            className="flex items-center gap-2"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Opnieuw versturen
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Eye className="h-3 w-3" />
                            Bekijk email
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <X className="h-3 w-3" />
                            Annuleren
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {invitation.status === 'connected' && invitation.connectedAt && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Familie verbonden op {new Date(invitation.connectedAt).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}