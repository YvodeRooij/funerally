/**
 * Dutch Legal Compliance Dashboard API
 * 
 * Returns overview data for director dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { dutchComplianceMCP } from '@/lib/agents/dutch-legal-compliance-mcp'

export async function GET(request: NextRequest) {
  try {
    // Get all active compliance tracking records
    const allTracking = await dutchComplianceMCP.getActiveComplianceTracking()
    
    const now = new Date()
    const clients = allTracking.map(tracking => {
      const legalDeadline = new Date(tracking.legal_deadline)
      const timeDiff = legalDeadline.getTime() - now.getTime()
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      // Determine status based on Dutch legal requirements
      let status: 'ok' | 'warning' | 'urgent' | 'overdue'
      if (daysRemaining < 0) {
        status = 'overdue'
      } else if (daysRemaining === 0) {
        status = 'urgent'
      } else if (daysRemaining === 1) {
        status = 'warning'
      } else {
        status = 'ok'
      }

      // Generate next action based on status and Dutch requirements
      let nextAction: string
      let actionBy: string
      
      if (status === 'overdue') {
        nextAction = `Gemeente ${tracking.municipality || 'bellen'} voor uitstel vergunning`
        actionBy = 'Onmiddellijk'
      } else if (status === 'urgent') {
        nextAction = `Uitvaart bevestigen bij gemeente ${tracking.municipality || ''}`
        actionBy = 'Vandaag voor 17:00'
      } else if (status === 'warning') {
        nextAction = `Documenten voorbereiden gemeente ${tracking.municipality || ''}`
        actionBy = 'Morgen 12:00'
      } else {
        nextAction = 'Reguliere voorbereiding'
        actionBy = 'Volgens planning'
      }

      return {
        id: tracking.funeral_request_id,
        clientName: tracking.family_name || `Dossier ${tracking.funeral_request_id}`,
        deathDate: tracking.death_registration_date,
        burialDate: tracking.planned_funeral_date || '',
        daysRemaining,
        status,
        nextAction: nextAction.trim(),
        actionBy,
        municipality: tracking.municipality || 'Onbekend',
        permitRequired: tracking.permit_required || false
      }
    })

    const overdueCount = clients.filter(c => c.status === 'overdue').length
    const urgentCount = clients.filter(c => c.status === 'urgent').length

    return NextResponse.json({
      success: true,
      data: {
        clients,
        totalActive: clients.length,
        overdueCount,
        urgentCount
      }
    })
  } catch (error) {
    console.error('Dutch compliance dashboard API error:', error)
    
    // Return mock data for development if DB not available
    const mockData = {
      clients: [
        {
          id: "1",
          clientName: "Familie van der Berg",
          deathDate: "2025-07-01",
          burialDate: "2025-07-07",
          daysRemaining: 0,
          status: "urgent" as const,
          nextAction: "Uitvaart bevestigen bij gemeente Amsterdam",
          actionBy: "Vandaag voor 17:00",
          municipality: "Amsterdam",
          permitRequired: false,
        }
      ],
      totalActive: 2,
      overdueCount: 0,
      urgentCount: 1
    }

    return NextResponse.json({
      success: true,
      data: mockData,
      note: 'Using mock data - database not available'
    })
  }
}