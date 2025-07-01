/**
 * Dutch Legal Compliance Agent
 * 
 * Handles Netherlands-specific funeral law compliance including:
 * - 6-day timeline enforcement
 * - Document generation (A/B certificates, Overlijdensakte, burial permits)
 * - Municipal system integration
 * - Emergency protocols for deadline management
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"

// Dutch Compliance State Management
export interface DutchComplianceState {
  complianceContext: DutchComplianceContext
  timelineEvents: TimelineEvent[]
  deadlineAlerts: DeadlineAlert[]
  requiredDocuments: RequiredDutchDocument[]
  municipalIntegration: MunicipalIntegrationData
}

// Types
export interface DutchComplianceContext {
  deathRegistrationDate: Date | null
  legalDeadline: Date | null
  deadlineDaysRemaining: number | null
  workingDaysCalculation: WorkingDaysCalculation | null
  emergencyProtocolTriggered: boolean
  complianceStatus: 'pending' | 'in_progress' | 'compliant' | 'at_risk' | 'emergency'
  municipalityCode: string | null
  bsnVerified: boolean
}

export interface TimelineEvent {
  id: string
  eventType: 'registration' | 'deadline_warning' | 'document_generated' | 'emergency_triggered'
  timestamp: Date
  description: string
  metadata: Record<string, any>
}

export interface DeadlineAlert {
  id: string
  alertType: 'info' | 'warning' | 'critical' | 'emergency'
  hoursRemaining: number
  message: string
  actionRequired: string[]
  stakeholders: string[]
}

export interface RequiredDutchDocument {
  documentType: 'a_certificate' | 'b_certificate' | 'overlijdensakte' | 'burial_permit' | 'cremation_permit'
  isRequired: boolean
  isGenerated: boolean
  generatedAt: Date | null
  expiresAt: Date | null
  documentId: string | null
}

export interface WorkingDaysCalculation {
  startDate: Date
  endDate: Date
  totalDays: number
  workingDays: number
  holidays: Date[]
  weekends: Date[]
}

export interface MunicipalIntegrationData {
  municipalityName: string | null
  apiEndpoint: string | null
  integrationStatus: 'not_started' | 'connecting' | 'connected' | 'error'
  lastSyncAt: Date | null
  syncErrors: string[]
  permitsIssued: string[]
}

// Dutch Holiday Calendar (2024-2025)
const DUTCH_HOLIDAYS_2024_2025: Date[] = [
  // 2024
  new Date('2024-01-01'), // New Year's Day
  new Date('2024-03-29'), // Good Friday
  new Date('2024-03-31'), // Easter Sunday
  new Date('2024-04-01'), // Easter Monday
  new Date('2024-04-27'), // King's Day
  new Date('2024-05-05'), // Liberation Day
  new Date('2024-05-09'), // Ascension Day
  new Date('2024-05-19'), // Whit Sunday
  new Date('2024-05-20'), // Whit Monday
  new Date('2024-12-25'), // Christmas Day
  new Date('2024-12-26'), // Boxing Day
  
  // 2025
  new Date('2025-01-01'), // New Year's Day
  new Date('2025-04-18'), // Good Friday
  new Date('2025-04-20'), // Easter Sunday
  new Date('2025-04-21'), // Easter Monday
  new Date('2025-04-27'), // King's Day
  new Date('2025-05-05'), // Liberation Day
  new Date('2025-05-29'), // Ascension Day
  new Date('2025-06-08'), // Whit Sunday
  new Date('2025-06-09'), // Whit Monday
  new Date('2025-12-25'), // Christmas Day
  new Date('2025-12-26'), // Boxing Day
]

/**
 * Dutch Working Days Calculator
 * Calculates working days excluding weekends and Dutch public holidays
 */
export class DutchWorkingDaysCalculator {
  private holidays: Set<string>

  constructor() {
    this.holidays = new Set(
      DUTCH_HOLIDAYS_2024_2025.map(date => date.toISOString().split('T')[0])
    )
  }

  /**
   * Calculate working days between two dates
   */
  calculateWorkingDays(startDate: Date, endDate: Date): WorkingDaysCalculation {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    let workingDays = 0
    let totalDays = 0
    const holidays: Date[] = []
    const weekends: Date[] = []
    
    const current = new Date(start)
    
    while (current <= end) {
      totalDays++
      
      const dayOfWeek = current.getDay()
      const dateString = current.toISOString().split('T')[0]
      
      // Check if weekend (Saturday = 6, Sunday = 0)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekends.push(new Date(current))
      }
      // Check if holiday
      else if (this.holidays.has(dateString)) {
        holidays.push(new Date(current))
      }
      // Working day
      else {
        workingDays++
      }
      
      current.setDate(current.getDate() + 1)
    }
    
    return {
      startDate: start,
      endDate: end,
      totalDays,
      workingDays,
      holidays,
      weekends
    }
  }

  /**
   * Calculate legal deadline (6 working days from death registration)
   */
  calculateLegalDeadline(deathRegistrationDate: Date): Date {
    const current = new Date(deathRegistrationDate)
    let workingDaysAdded = 0
    
    while (workingDaysAdded < 6) {
      current.setDate(current.getDate() + 1)
      
      const dayOfWeek = current.getDay()
      const dateString = current.toISOString().split('T')[0]
      
      // Skip weekends and holidays
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !this.holidays.has(dateString)) {
        workingDaysAdded++
      }
    }
    
    return current
  }

  /**
   * Get days remaining until deadline
   */
  getDaysRemaining(deadline: Date): number {
    const now = new Date()
    const timeDiff = deadline.getTime() - now.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }
}

/**
 * Dutch Timeline Enforcement Service
 */
export class DutchTimelineEnforcement {
  private workingDaysCalculator: DutchWorkingDaysCalculator

  constructor() {
    this.workingDaysCalculator = new DutchWorkingDaysCalculator()
  }

  /**
   * Initialize compliance tracking for a funeral request
   */
  async initializeCompliance(funeralRequestId: string, deathRegistrationDate: Date): Promise<DutchComplianceContext> {
    const legalDeadline = this.workingDaysCalculator.calculateLegalDeadline(deathRegistrationDate)
    const deadlineDaysRemaining = this.workingDaysCalculator.getDaysRemaining(legalDeadline)
    const workingDaysCalculation = this.workingDaysCalculator.calculateWorkingDays(deathRegistrationDate, legalDeadline)

    const complianceContext: DutchComplianceContext = {
      deathRegistrationDate,
      legalDeadline,
      deadlineDaysRemaining,
      workingDaysCalculation,
      emergencyProtocolTriggered: false,
      complianceStatus: this.determineComplianceStatus(deadlineDaysRemaining),
      municipalityCode: null,
      bsnVerified: false
    }

    // Store in database using Supabase MCP
    await this.insertComplianceTracking({
      funeral_request_id: funeralRequestId,
      death_registration_date: deathRegistrationDate.toISOString(),
      legal_deadline: legalDeadline.toISOString(),
      working_days_remaining: deadlineDaysRemaining,
      compliance_status: complianceContext.complianceStatus,
      emergency_protocol_active: false,
      created_at: new Date().toISOString()
    })

    return complianceContext
  }

  /**
   * Update compliance status based on days remaining
   */
  private determineComplianceStatus(daysRemaining: number): DutchComplianceContext['complianceStatus'] {
    if (daysRemaining <= 0) return 'emergency'
    if (daysRemaining <= 1) return 'at_risk'
    if (daysRemaining <= 2) return 'in_progress'
    return 'pending'
  }

  /**
   * Monitor and update compliance status
   */
  async monitorCompliance(funeralRequestId: string): Promise<DutchComplianceContext> {
    const tracking = await this.getComplianceTracking(funeralRequestId)

    if (!tracking) {
      throw new Error(`No compliance tracking found for funeral request ${funeralRequestId}`)
    }

    const legalDeadline = new Date(tracking.legal_deadline)
    const deadlineDaysRemaining = this.workingDaysCalculator.getDaysRemaining(legalDeadline)
    const newComplianceStatus = this.determineComplianceStatus(deadlineDaysRemaining)

    // Update database
    await this.updateComplianceTracking(funeralRequestId, {
      working_days_remaining: deadlineDaysRemaining,
      compliance_status: newComplianceStatus,
      last_checked_at: new Date().toISOString()
    })

    return {
      deathRegistrationDate: new Date(tracking.death_registration_date),
      legalDeadline,
      deadlineDaysRemaining,
      workingDaysCalculation: null, // Will be calculated if needed
      emergencyProtocolTriggered: tracking.emergency_protocol_active,
      complianceStatus: newComplianceStatus,
      municipalityCode: tracking.municipality_code,
      bsnVerified: tracking.bsn_verified
    }
  }

  /**
   * Supabase MCP Database Operations
   */
  private async insertComplianceTracking(data: any) {
    const { dutchComplianceMCP } = await import('./dutch-legal-compliance-mcp')
    return dutchComplianceMCP.insertComplianceTracking(data)
  }

  private async getComplianceTracking(funeralRequestId: string) {
    const { dutchComplianceMCP } = await import('./dutch-legal-compliance-mcp')
    return dutchComplianceMCP.getComplianceTracking(funeralRequestId)
  }

  private async updateComplianceTracking(funeralRequestId: string, data: any) {
    const { dutchComplianceMCP } = await import('./dutch-legal-compliance-mcp')
    return dutchComplianceMCP.updateComplianceTracking(funeralRequestId, data)
  }

  /**
   * Generate timeline alerts based on compliance status
   */
  generateTimelineAlerts(complianceContext: DutchComplianceContext): DeadlineAlert[] {
    const alerts: DeadlineAlert[] = []
    const hoursRemaining = (complianceContext.deadlineDaysRemaining || 0) * 24

    switch (complianceContext.complianceStatus) {
      case 'emergency':
        alerts.push({
          id: `emergency-${Date.now()}`,
          alertType: 'emergency',
          hoursRemaining,
          message: 'EMERGENCY: Legal deadline has passed! Immediate action required.',
          actionRequired: [
            'Contact municipality immediately',
            'Request emergency extension',
            'Activate emergency funeral protocol',
            'Notify all stakeholders'
          ],
          stakeholders: ['family', 'director', 'municipality', 'management']
        })
        break

      case 'at_risk':
        alerts.push({
          id: `critical-${Date.now()}`,
          alertType: 'critical',
          hoursRemaining,
          message: 'CRITICAL: Less than 1 day remaining until legal deadline!',
          actionRequired: [
            'Finalize all arrangements immediately',
            'Confirm venue and time',
            'Generate all required documents',
            'Send final confirmations'
          ],
          stakeholders: ['family', 'director', 'venue']
        })
        break

      case 'in_progress':
        alerts.push({
          id: `warning-${Date.now()}`,
          alertType: 'warning',
          hoursRemaining,
          message: 'WARNING: 2 days or less remaining. Ensure progress is being made.',
          actionRequired: [
            'Confirm all major decisions',
            'Book venue if not done',
            'Order required services',
            'Prepare documentation'
          ],
          stakeholders: ['family', 'director']
        })
        break

      case 'pending':
        alerts.push({
          id: `info-${Date.now()}`,
          alertType: 'info',
          hoursRemaining,
          message: 'Timeline on track. Continue with funeral planning.',
          actionRequired: [
            'Gather family preferences',
            'Explore venue options',
            'Review service options'
          ],
          stakeholders: ['family', 'director']
        })
        break
    }

    return alerts
  }
}

/**
 * Emergency Protocol Handler
 */
export class DutchEmergencyProtocol {
  /**
   * Trigger emergency response protocol
   */
  async triggerEmergencyResponse(funeralRequestId: string, complianceContext: DutchComplianceContext): Promise<EmergencyResponse> {
    console.log(`🚨 EMERGENCY PROTOCOL TRIGGERED for ${funeralRequestId}`)

    // Update database to mark emergency protocol as active
    await this.updateEmergencyStatus(funeralRequestId, {
      emergency_protocol_active: true,
      emergency_triggered_at: new Date().toISOString()
    })

    // Log emergency event
    await this.insertTimelineEvent({
      funeral_request_id: funeralRequestId,
      event_type: 'emergency_triggered',
      timestamp: new Date().toISOString(),
      description: 'Emergency protocol activated due to deadline breach',
      metadata: {
        days_overdue: Math.abs(complianceContext.deadlineDaysRemaining || 0),
        compliance_status: complianceContext.complianceStatus
      }
    })

    // TODO: Implement actual alert mechanisms
    // - SMS alerts to primary contacts
    // - Email alerts to stakeholders
    // - WhatsApp emergency notifications
    // - Management escalation
    // - Municipal emergency contact

    return {
      alertsSent: 0, // Will be actual count when implemented
      emergencyProtocolActive: true,
      nextReviewTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      escalationLevel: 'critical'
    }
  }

  /**
   * Supabase MCP Database Operations
   */
  private async updateEmergencyStatus(funeralRequestId: string, data: any) {
    const { dutchComplianceMCP } = await import('./dutch-legal-compliance-mcp')
    return dutchComplianceMCP.updateComplianceTracking(funeralRequestId, data)
  }

  private async insertTimelineEvent(data: any) {
    const { dutchComplianceMCP } = await import('./dutch-legal-compliance-mcp')
    return dutchComplianceMCP.insertTimelineEvent(data)
  }
}

export interface EmergencyResponse {
  alertsSent: number
  emergencyProtocolActive: boolean
  nextReviewTime: Date
  escalationLevel: 'warning' | 'critical' | 'emergency'
}

/**
 * Main Dutch Legal Compliance Agent
 */
export class DutchLegalComplianceAgent {
  private model: ChatGoogleGenerativeAI
  private timelineEnforcement: DutchTimelineEnforcement
  private emergencyProtocol: DutchEmergencyProtocol

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash-exp",
      apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      temperature: 0.1 // Low temperature for compliance accuracy
    })
    this.timelineEnforcement = new DutchTimelineEnforcement()
    this.emergencyProtocol = new DutchEmergencyProtocol()
  }

  /**
   * Main compliance processing method
   */
  async processCompliance(funeralRequestId: string, deathRegistrationDate: Date): Promise<DutchComplianceContext> {
    // Initialize compliance tracking
    const complianceContext = await this.timelineEnforcement.initializeCompliance(funeralRequestId, deathRegistrationDate)

    // Check if emergency protocol needed
    if (complianceContext.complianceStatus === 'emergency') {
      await this.emergencyProtocol.triggerEmergencyResponse(funeralRequestId, complianceContext)
    }

    return complianceContext
  }

  /**
   * Monitor existing compliance
   */
  async monitorCompliance(funeralRequestId: string): Promise<DutchComplianceContext> {
    return this.timelineEnforcement.monitorCompliance(funeralRequestId)
  }

  /**
   * Generate compliance alerts
   */
  generateAlerts(complianceContext: DutchComplianceContext): DeadlineAlert[] {
    return this.timelineEnforcement.generateTimelineAlerts(complianceContext)
  }
}

// Export singleton instance
export const dutchLegalComplianceAgent = new DutchLegalComplianceAgent()