import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-supabase"
import { getServiceSupabaseClient } from "@/lib/supabase"
import { encrypt } from "@/lib/encryption"

// LangGraph report generation (placeholder for actual implementation)
async function generateAIReport(intakeData: any, chatHistory: any[]) {
  // TODO: Integrate actual LangGraph JS here
  // For now, create a structured report based on intake data
  
  const report = {
    generated_at: new Date().toISOString(),
    family_situation: {
      deceased_name: intakeData.deceasedName,
      date_of_death: intakeData.dateOfDeath,
      relationship: intakeData.relationship,
      urgency_level: "normal"
    },
    service_preferences: {
      type: intakeData.serviceType,
      location: intakeData.location,
      expected_attendees: intakeData.attendees,
      cultural_requirements: intakeData.culturalRequirements || []
    },
    financial_situation: {
      has_insurance: intakeData.hasInsurance,
      insurance_provider: intakeData.insuranceProvider,
      needs_financial_help: intakeData.needsFinancialHelp,
      gemeente: intakeData.gemeente,
      estimated_budget_range: calculateBudgetRange(intakeData)
    },
    special_requests: intakeData.specialRequests,
    ai_recommendations: {
      suitable_directors: [],
      venue_suggestions: [],
      service_recommendations: [],
      cost_optimization_tips: []
    },
    conversation_insights: analyzeConversations(chatHistory)
  }

  return report
}

function calculateBudgetRange(intakeData: any) {
  // Simple budget estimation based on service type and attendees
  const baseRanges = {
    burial: { min: 5000, max: 15000 },
    cremation: { min: 3000, max: 10000 },
    memorial: { min: 1000, max: 5000 },
    unsure: { min: 3000, max: 15000 }
  }

  const attendeeMultiplier = {
    "0-25": 1,
    "25-50": 1.3,
    "50-100": 1.6,
    "100+": 2
  }

  const base = baseRanges[intakeData.serviceType as keyof typeof baseRanges] || baseRanges.unsure
  const multiplier = attendeeMultiplier[intakeData.attendees as keyof typeof attendeeMultiplier] || 1

  return {
    min: Math.round(base.min * multiplier),
    max: Math.round(base.max * multiplier)
  }
}

function analyzeConversations(chatHistory: any[]) {
  // Analyze chat history for insights
  const insights = {
    main_concerns: [],
    emotional_state: "processing",
    questions_asked: chatHistory.filter(m => m.type === "user").length,
    preferred_communication_style: "supportive",
    additional_notes: []
  }

  // Extract concerns from conversations
  const userMessages = chatHistory.filter(m => m.type === "user").map(m => m.message)
  
  if (userMessages.some(m => m.toLowerCase().includes("budget") || m.toLowerCase().includes("kosten"))) {
    insights.main_concerns.push("cost_conscious")
  }
  
  if (userMessages.some(m => m.toLowerCase().includes("snel") || m.toLowerCase().includes("urgent"))) {
    insights.main_concerns.push("time_sensitive")
  }

  if (userMessages.some(m => m.toLowerCase().includes("traditie") || m.toLowerCase().includes("cultuur"))) {
    insights.main_concerns.push("cultural_requirements")
  }

  return insights
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { intakeId, formData, userId } = await request.json()

    // Verify user owns this intake
    const supabase = getServiceSupabaseClient()
    
    const { data: intake, error: intakeError } = await supabase
      .from('family_intakes')
      .select('*')
      .eq('id', intakeId)
      .eq('user_id', userId)
      .single()

    if (intakeError || !intake) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 })
    }

    // Get chat history for this intake
    const { data: chatHistory } = await supabase
      .from('intake_chat_history')
      .select('*')
      .eq('intake_id', intakeId)
      .order('created_at', { ascending: true })

    // Generate AI report
    const report = await generateAIReport(formData, chatHistory || [])

    // Encrypt sensitive report data
    const encryptedReport = encrypt(JSON.stringify(report))

    // Create report summary (unencrypted) for searching
    const reportSummary = {
      service_type: report.service_preferences.type,
      location: report.service_preferences.location,
      budget_range: report.financial_situation.estimated_budget_range,
      has_insurance: report.financial_situation.has_insurance,
      urgency: report.family_situation.urgency_level,
      attendee_count: report.service_preferences.expected_attendees,
      cultural_requirements: report.service_preferences.cultural_requirements
    }

    // Save report to database
    const { data: savedReport, error: reportError } = await supabase
      .from('intake_reports')
      .insert({
        family_id: userId,
        intake_id: intakeId,
        report_data: encryptedReport,
        report_summary: reportSummary,
        status: 'pending_match'
      })
      .select()
      .single()

    if (reportError || !savedReport) {
      console.error('Error saving report:', reportError)
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
    }

    // TODO: Trigger matching system to find suitable directors
    // This would analyze the report and match with director profiles

    return NextResponse.json({ 
      success: true, 
      reportId: savedReport.id,
      message: "Report generated successfully"
    })

  } catch (error) {
    console.error('Error generating intake report:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}