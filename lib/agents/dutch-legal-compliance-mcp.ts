/**
 * Dutch Legal Compliance - Supabase MCP Integration
 * 
 * This module provides Supabase MCP database operations for Dutch legal compliance
 */

// MCP Supabase tools will be available in the runtime environment
// For now, we'll create a wrapper interface that can be implemented later

// Mock MCP function for development - will be replaced with actual MCP tools
async function executeSupabaseSQL(params: { query: string; params?: any[] }): Promise<{ success: boolean; data?: any[]; error?: string }> {
  console.log('Mock Supabase MCP SQL execution:', params.query, params.params)
  
  // For now, return a mock success response
  // In production, this will use the actual MCP Supabase tools
  return {
    success: true,
    data: [{ id: 'mock-id', success: true }]
  }
}

export interface ComplianceTrackingRecord {
  id?: string
  funeral_request_id: string
  death_registration_date: string
  legal_deadline: string
  working_days_remaining: number
  municipality_code?: string
  municipality_name?: string
  municipality?: string // alias for municipality_name
  family_name?: string
  planned_funeral_date?: string
  permit_required?: boolean
  bsn_verified?: boolean
  emergency_protocol_active?: boolean
  emergency_triggered_at?: string
  compliance_status: string
  last_checked_at?: string
  created_at?: string
  updated_at?: string
}

export interface TimelineEventRecord {
  id?: string
  funeral_request_id: string
  event_type: string
  timestamp: string
  description: string
  metadata?: any
  created_at?: string
}

/**
 * Dutch Legal Compliance Database Operations using Supabase MCP
 */
export class DutchComplianceMCP {
  /**
   * Initialize compliance tracking for a funeral request
   */
  async insertComplianceTracking(data: Partial<ComplianceTrackingRecord>): Promise<string> {
    const sql = `
      INSERT INTO dutch_compliance_tracking (
        funeral_request_id,
        death_registration_date,
        legal_deadline,
        working_days_remaining,
        municipality_code,
        municipality_name,
        bsn_verified,
        emergency_protocol_active,
        compliance_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING id;
    `

    const result = await executeSupabaseSQL({
      query: sql,
      params: [
        data.funeral_request_id,
        data.death_registration_date,
        data.legal_deadline,
        data.working_days_remaining,
        data.municipality_code || null,
        data.municipality_name || null,
        data.bsn_verified || false,
        data.emergency_protocol_active || false,
        data.compliance_status
      ]
    })

    return result.data?.[0]?.id || ''
  }

  /**
   * Get compliance tracking record by funeral request ID
   */
  async getComplianceTracking(funeralRequestId: string): Promise<ComplianceTrackingRecord | null> {
    const sql = `
      SELECT *
      FROM dutch_compliance_tracking
      WHERE funeral_request_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `

    const result = await executeSupabaseSQL({
      query: sql,
      params: [funeralRequestId]
    })

    return result.data?.[0] || null
  }

  /**
   * Update compliance tracking record
   */
  async updateComplianceTracking(funeralRequestId: string, updates: Partial<ComplianceTrackingRecord>): Promise<boolean> {
    const setParts: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Build dynamic UPDATE query based on provided fields
    if (updates.working_days_remaining !== undefined) {
      setParts.push(`working_days_remaining = $${paramIndex++}`)
      params.push(updates.working_days_remaining)
    }
    if (updates.compliance_status !== undefined) {
      setParts.push(`compliance_status = $${paramIndex++}`)
      params.push(updates.compliance_status)
    }
    if (updates.emergency_protocol_active !== undefined) {
      setParts.push(`emergency_protocol_active = $${paramIndex++}`)
      params.push(updates.emergency_protocol_active)
    }
    if (updates.emergency_triggered_at !== undefined) {
      setParts.push(`emergency_triggered_at = $${paramIndex++}`)
      params.push(updates.emergency_triggered_at)
    }
    if (updates.bsn_verified !== undefined) {
      setParts.push(`bsn_verified = $${paramIndex++}`)
      params.push(updates.bsn_verified)
    }
    if (updates.municipality_code !== undefined) {
      setParts.push(`municipality_code = $${paramIndex++}`)
      params.push(updates.municipality_code)
    }

    // Always update the updated_at timestamp
    setParts.push(`updated_at = NOW()`)

    if (setParts.length === 1) { // Only updated_at was added
      return true // No actual updates to perform
    }

    const sql = `
      UPDATE dutch_compliance_tracking
      SET ${setParts.join(', ')}
      WHERE funeral_request_id = $${paramIndex};
    `
    params.push(funeralRequestId)

    const result = await executeSupabaseSQL({
      query: sql,
      params
    })

    return result.success
  }

  /**
   * Insert timeline event
   */
  async insertTimelineEvent(data: Partial<TimelineEventRecord>): Promise<string> {
    const sql = `
      INSERT INTO timeline_events (
        funeral_request_id,
        event_type,
        timestamp,
        description,
        metadata
      ) VALUES (
        $1, $2, $3, $4, $5
      ) RETURNING id;
    `

    const result = await executeSupabaseSQL({
      query: sql,
      params: [
        data.funeral_request_id,
        data.event_type,
        data.timestamp,
        data.description,
        JSON.stringify(data.metadata || {})
      ]
    })

    return result.data?.[0]?.id || ''
  }

  /**
   * Get timeline events for a funeral request
   */
  async getTimelineEvents(funeralRequestId: string): Promise<TimelineEventRecord[]> {
    const sql = `
      SELECT *
      FROM timeline_events
      WHERE funeral_request_id = $1
      ORDER BY timestamp DESC;
    `

    const result = await executeSupabaseSQL({
      query: sql,
      params: [funeralRequestId]
    })

    return result.data || []
  }

  /**
   * Get all compliance tracking records that need monitoring
   */
  async getActiveComplianceTracking(): Promise<ComplianceTrackingRecord[]> {
    const sql = `
      SELECT *
      FROM dutch_compliance_tracking
      WHERE compliance_status IN ('pending', 'in_progress', 'at_risk')
        AND emergency_protocol_active = false
      ORDER BY legal_deadline ASC;
    `

    const result = await executeSupabaseSQL({
      query: sql,
      params: []
    })

    return result.data || []
  }

  /**
   * Insert compliance alert
   */
  async insertComplianceAlert(data: {
    funeral_request_id: string
    alert_type: string
    hours_remaining?: number
    message: string
    action_required: string[]
    stakeholders: string[]
  }): Promise<string> {
    const sql = `
      INSERT INTO compliance_alerts (
        funeral_request_id,
        alert_type,
        hours_remaining,
        message,
        action_required,
        stakeholders
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      ) RETURNING id;
    `

    const result = await executeSupabaseSQL({
      query: sql,
      params: [
        data.funeral_request_id,
        data.alert_type,
        data.hours_remaining || null,
        data.message,
        JSON.stringify(data.action_required),
        JSON.stringify(data.stakeholders)
      ]
    })

    return result.data?.[0]?.id || ''
  }

  /**
   * Check if Dutch holidays table has data, and initialize if needed
   */
  async ensureDutchHolidaysData(): Promise<boolean> {
    // Check if holidays data exists
    const checkSql = `
      SELECT COUNT(*) as count
      FROM dutch_working_days_calendar
      WHERE date >= '2024-01-01' AND date <= '2025-12-31';
    `

    const checkResult = await executeSupabaseSQL({
      query: checkSql,
      params: []
    })

    const count = checkResult.data?.[0]?.count || 0

    if (count < 10) { // Less than expected holidays, reinitialize
      // Delete existing data for the range
      const deleteSql = `
        DELETE FROM dutch_working_days_calendar
        WHERE date >= '2024-01-01' AND date <= '2025-12-31';
      `

      await executeSupabaseSQL({
        query: deleteSql,
        params: []
      })

      // Insert holidays data
      const holidays = [
        // 2024 holidays
        { date: '2024-01-01', name: 'Nieuwjaarsdag', type: 'national' },
        { date: '2024-03-29', name: 'Goede Vrijdag', type: 'national' },
        { date: '2024-03-31', name: 'Eerste Paasdag', type: 'national' },
        { date: '2024-04-01', name: 'Tweede Paasdag', type: 'national' },
        { date: '2024-04-27', name: 'Koningsdag', type: 'national' },
        { date: '2024-05-05', name: 'Bevrijdingsdag', type: 'national' },
        { date: '2024-05-09', name: 'Hemelvaartsdag', type: 'national' },
        { date: '2024-05-19', name: 'Eerste Pinksterdag', type: 'national' },
        { date: '2024-05-20', name: 'Tweede Pinksterdag', type: 'national' },
        { date: '2024-12-25', name: 'Eerste Kerstdag', type: 'national' },
        { date: '2024-12-26', name: 'Tweede Kerstdag', type: 'national' },
        
        // 2025 holidays
        { date: '2025-01-01', name: 'Nieuwjaarsdag', type: 'national' },
        { date: '2025-04-18', name: 'Goede Vrijdag', type: 'national' },
        { date: '2025-04-20', name: 'Eerste Paasdag', type: 'national' },
        { date: '2025-04-21', name: 'Tweede Paasdag', type: 'national' },
        { date: '2025-04-27', name: 'Koningsdag', type: 'national' },
        { date: '2025-05-05', name: 'Bevrijdingsdag', type: 'national' },
        { date: '2025-05-29', name: 'Hemelvaartsdag', type: 'national' },
        { date: '2025-06-08', name: 'Eerste Pinksterdag', type: 'national' },
        { date: '2025-06-09', name: 'Tweede Pinksterdag', type: 'national' },
        { date: '2025-12-25', name: 'Eerste Kerstdag', type: 'national' },
        { date: '2025-12-26', name: 'Tweede Kerstdag', type: 'national' }
      ]

      for (const holiday of holidays) {
        const insertSql = `
          INSERT INTO dutch_working_days_calendar (date, is_working_day, holiday_name, holiday_type)
          VALUES ($1, false, $2, $3)
          ON CONFLICT (date) DO NOTHING;
        `

        await executeSupabaseSQL({
          query: insertSql,
          params: [holiday.date, holiday.name, holiday.type]
        })
      }
    }

    return true
  }

  /**
   * Get Dutch holidays for date calculations
   */
  async getDutchHolidays(startDate: string, endDate: string): Promise<string[]> {
    const sql = `
      SELECT date
      FROM dutch_working_days_calendar
      WHERE date >= $1 AND date <= $2
        AND is_working_day = false;
    `

    const result = await executeSupabaseSQL({
      query: sql,
      params: [startDate, endDate]
    })

    return (result.data || []).map((row: any) => row.date)
  }
}

// Export singleton instance
export const dutchComplianceMCP = new DutchComplianceMCP()