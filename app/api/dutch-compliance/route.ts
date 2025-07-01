/**
 * Dutch Legal Compliance API Endpoints
 * 
 * Handles Netherlands-specific funeral law compliance operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { dutchLegalComplianceAgent } from '@/lib/agents/dutch-legal-compliance'
import { dutchComplianceMCP } from '@/lib/agents/dutch-legal-compliance-mcp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, funeralRequestId, deathRegistrationDate, ...params } = body

    switch (action) {
      case 'initialize_compliance':
        return handleInitializeCompliance(funeralRequestId, deathRegistrationDate)
      
      case 'monitor_compliance':
        return handleMonitorCompliance(funeralRequestId)
      
      case 'get_compliance_status':
        return handleGetComplianceStatus(funeralRequestId)
      
      case 'trigger_emergency':
        return handleTriggerEmergency(funeralRequestId)
      
      case 'acknowledge_alert':
        return handleAcknowledgeAlert(params.alertId, params.userId)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Dutch compliance API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const funeralRequestId = searchParams.get('funeralRequestId')
    const action = searchParams.get('action')

    if (!funeralRequestId) {
      return NextResponse.json(
        { error: 'Funeral request ID is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'status':
        return handleGetComplianceStatus(funeralRequestId)
      
      case 'timeline':
        return handleGetTimeline(funeralRequestId)
      
      case 'alerts':
        return handleGetAlerts(funeralRequestId)
      
      default:
        return handleGetComplianceStatus(funeralRequestId)
    }
  } catch (error) {
    console.error('Dutch compliance GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Initialize compliance tracking for a funeral request
 */
async function handleInitializeCompliance(funeralRequestId: string, deathRegistrationDate: string) {
  if (!funeralRequestId || !deathRegistrationDate) {
    return NextResponse.json(
      { error: 'Funeral request ID and death registration date are required' },
      { status: 400 }
    )
  }

  try {
    const deathDate = new Date(deathRegistrationDate)
    const complianceContext = await dutchLegalComplianceAgent.processCompliance(
      funeralRequestId,
      deathDate
    )

    const alerts = dutchLegalComplianceAgent.generateAlerts(complianceContext)

    return NextResponse.json({
      success: true,
      data: {
        complianceContext,
        alerts,
        message: 'Dutch legal compliance tracking initialized'
      }
    })
  } catch (error) {
    console.error('Error initializing compliance:', error)
    return NextResponse.json(
      { error: 'Failed to initialize compliance tracking' },
      { status: 500 }
    )
  }
}

/**
 * Monitor and update compliance status
 */
async function handleMonitorCompliance(funeralRequestId: string) {
  if (!funeralRequestId) {
    return NextResponse.json(
      { error: 'Funeral request ID is required' },
      { status: 400 }
    )
  }

  try {
    const complianceContext = await dutchLegalComplianceAgent.monitorCompliance(funeralRequestId)
    const alerts = dutchLegalComplianceAgent.generateAlerts(complianceContext)

    return NextResponse.json({
      success: true,
      data: {
        complianceContext,
        alerts,
        message: 'Compliance status updated'
      }
    })
  } catch (error) {
    console.error('Error monitoring compliance:', error)
    return NextResponse.json(
      { error: 'Failed to monitor compliance' },
      { status: 500 }
    )
  }
}

/**
 * Get current compliance status
 */
async function handleGetComplianceStatus(funeralRequestId: string) {
  try {
    const tracking = await dutchComplianceMCP.getComplianceTracking(funeralRequestId)
    
    if (!tracking) {
      return NextResponse.json(
        { error: 'No compliance tracking found for this funeral request' },
        { status: 404 }
      )
    }

    // Calculate current status
    const legalDeadline = new Date(tracking.legal_deadline)
    const now = new Date()
    const timeDiff = legalDeadline.getTime() - now.getTime()
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24))

    return NextResponse.json({
      success: true,
      data: {
        tracking,
        daysRemaining,
        isOverdue: daysRemaining < 0,
        timelineStatus: tracking.compliance_status
      }
    })
  } catch (error) {
    console.error('Error getting compliance status:', error)
    return NextResponse.json(
      { error: 'Failed to get compliance status' },
      { status: 500 }
    )
  }
}

/**
 * Get timeline events
 */
async function handleGetTimeline(funeralRequestId: string) {
  try {
    const events = await dutchComplianceMCP.getTimelineEvents(funeralRequestId)
    
    return NextResponse.json({
      success: true,
      data: { events }
    })
  } catch (error) {
    console.error('Error getting timeline:', error)
    return NextResponse.json(
      { error: 'Failed to get timeline events' },
      { status: 500 }
    )
  }
}

/**
 * Get compliance alerts
 */
async function handleGetAlerts(funeralRequestId: string) {
  try {
    // For now, generate alerts based on current status
    const complianceContext = await dutchLegalComplianceAgent.monitorCompliance(funeralRequestId)
    const alerts = dutchLegalComplianceAgent.generateAlerts(complianceContext)
    
    return NextResponse.json({
      success: true,
      data: { alerts }
    })
  } catch (error) {
    console.error('Error getting alerts:', error)
    return NextResponse.json(
      { error: 'Failed to get alerts' },
      { status: 500 }
    )
  }
}

/**
 * Trigger emergency protocol
 */
async function handleTriggerEmergency(funeralRequestId: string) {
  try {
    const complianceContext = await dutchLegalComplianceAgent.monitorCompliance(funeralRequestId)
    
    // Force emergency status
    complianceContext.complianceStatus = 'emergency'
    complianceContext.emergencyProtocolTriggered = true
    
    const emergencyAlerts = dutchLegalComplianceAgent.generateAlerts(complianceContext)
    
    return NextResponse.json({
      success: true,
      data: {
        emergencyTriggered: true,
        alerts: emergencyAlerts,
        message: 'Emergency protocol activated'
      }
    })
  } catch (error) {
    console.error('Error triggering emergency:', error)
    return NextResponse.json(
      { error: 'Failed to trigger emergency protocol' },
      { status: 500 }
    )
  }
}

/**
 * Acknowledge an alert
 */
async function handleAcknowledgeAlert(alertId: string, userId: string) {
  try {
    // TODO: Implement alert acknowledgment in database
    console.log(`Alert ${alertId} acknowledged by user ${userId}`)
    
    return NextResponse.json({
      success: true,
      data: {
        alertId,
        acknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error acknowledging alert:', error)
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    )
  }
}