"use client"

/**
 * Dutch Legal Compliance Dashboard Component
 * 
 * Displays Dutch funeral law compliance status for directors
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Calendar,
  FileText,
  Phone,
  Mail,
  MessageSquare,
  RefreshCw,
  Shield,
  Building
} from 'lucide-react'

interface ComplianceStatus {
  complianceStatus: string
  legalDeadline: string
  daysRemaining: number
  isOverdue: boolean
  timelineStatus: string
  emergencyTriggered?: boolean
  lastChecked?: string
}

interface ComplianceAlert {
  id: string
  alertType: 'info' | 'warning' | 'critical' | 'emergency'
  message: string
  hoursRemaining: number
  actionRequired: string[]
  stakeholders: string[]
}

interface DutchComplianceDashboardProps {
  funeralRequestId: string
}

export function DutchComplianceDashboard({ funeralRequestId }: DutchComplianceDashboardProps) {
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null)
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch compliance status
  const fetchComplianceStatus = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/dutch-compliance?funeralRequestId=${funeralRequestId}&action=status`)
      const data = await response.json()
      
      if (data.success) {
        setComplianceStatus(data.data)
      } else {
        setError(data.error || 'Failed to fetch compliance status')
      }
    } catch (err) {
      setError('Error fetching compliance status')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/dutch-compliance?funeralRequestId=${funeralRequestId}&action=alerts`)
      const data = await response.json()
      
      if (data.success) {
        setAlerts(data.data.alerts || [])
      }
    } catch (err) {
      console.error('Error fetching alerts:', err)
    }
  }

  // Trigger emergency protocol
  const triggerEmergency = async () => {
    try {
      const response = await fetch('/api/dutch-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_emergency',
          funeralRequestId
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchComplianceStatus()
        await fetchAlerts()
      }
    } catch (err) {
      console.error('Error triggering emergency:', err)
    }
  }

  // Manual compliance check
  const performManualCheck = async () => {
    try {
      const response = await fetch('/api/dutch-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'monitor_compliance',
          funeralRequestId
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchComplianceStatus()
        await fetchAlerts()
      }
    } catch (err) {
      console.error('Error performing manual check:', err)
    }
  }

  useEffect(() => {
    fetchComplianceStatus()
    fetchAlerts()
    
    // Auto-refresh every 30 minutes
    const interval = setInterval(() => {
      fetchComplianceStatus()
      fetchAlerts()
    }, 30 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [funeralRequestId])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'emergency': return 'destructive'
      case 'at_risk': return 'destructive'
      case 'in_progress': return 'secondary'
      case 'compliant': return 'default'
      default: return 'outline'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'emergency': return <AlertCircle className="h-4 w-4" />
      case 'at_risk': return <AlertTriangle className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'compliant': return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!complianceStatus) return 0
    const totalDays = 6 // Total working days allowed
    const remaining = Math.max(0, complianceStatus.daysRemaining)
    return ((totalDays - remaining) / totalDays) * 100
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dutch Legal Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading compliance status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dutch Legal Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dutch Legal Compliance Status
          </CardTitle>
          <CardDescription>
            6-day timeline monitoring for Netherlands funeral law compliance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {complianceStatus && (
            <>
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge 
                  variant={getStatusColor(complianceStatus.complianceStatus)}
                  className="flex items-center gap-1"
                >
                  {getStatusIcon(complianceStatus.complianceStatus)}
                  {complianceStatus.complianceStatus.replace('_', ' ').toUpperCase()}
                </Badge>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={performManualCheck}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Check Now
                </Button>
              </div>

              {/* Timeline Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Timeline Progress</span>
                  <span className="font-medium">
                    {complianceStatus.isOverdue 
                      ? `${Math.abs(complianceStatus.daysRemaining)} days overdue`
                      : `${complianceStatus.daysRemaining} days remaining`
                    }
                  </span>
                </div>
                <Progress 
                  value={getProgressPercentage()} 
                  className={complianceStatus.isOverdue ? "bg-red-100" : ""} 
                />
              </div>

              {/* Legal Deadline */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Legal Deadline: </span>
                <span className="font-medium">
                  {new Date(complianceStatus.legalDeadline).toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {/* Emergency Actions */}
              {(complianceStatus.complianceStatus === 'emergency' || complianceStatus.emergencyTriggered) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium text-red-700">
                    EMERGENCY PROTOCOL ACTIVE - Immediate action required!
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Compliance Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert, index) => (
              <Alert key={index} className={
                alert.alertType === 'emergency' ? 'border-red-500 bg-red-50' :
                alert.alertType === 'critical' ? 'border-orange-500 bg-orange-50' :
                alert.alertType === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{alert.message}</p>
                    
                    {alert.actionRequired.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Required Actions:</p>
                        <ul className="text-sm space-y-1">
                          {alert.actionRequired.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {alert.stakeholders.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>Notify:</span>
                        {alert.stakeholders.map((stakeholder, stakeholderIndex) => (
                          <Badge key={stakeholderIndex} variant="outline" className="text-xs">
                            {stakeholder}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              Call Municipality
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Email Stakeholders
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              WhatsApp Family
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Generate Docs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Trigger (for testing) */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Emergency Controls</CardTitle>
          <CardDescription>
            Use only in genuine emergency situations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={triggerEmergency}
            className="w-full"
          >
            Trigger Emergency Protocol
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}