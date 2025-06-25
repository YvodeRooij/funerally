import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-supabase"
import { getServiceSupabaseClient } from "@/lib/supabase"
import { encrypt } from "@/lib/encryption"
import { generateComprehensiveReport, saveReportWithDirectorAccess, generateDirectorAccessCode, type ReportInput } from "@/lib/agents/report-generation-agent"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { intakeId, formData, userId, directorCode } = await request.json()

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

    // Get user profile for context
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('🤖 Starting enhanced LangGraph report generation...')

    // Prepare input for the LangGraph report agent
    const reportInput: ReportInput = {
      intakeData: formData,
      chatHistory: chatHistory || [],
      userProfile: userProfile || {}
    }

    // Generate comprehensive AI report using LangGraph + Gemini
    const reportAnalysis = await generateComprehensiveReport(reportInput)
    
    console.log('✅ LangGraph report analysis completed')

    // Generate access code for director
    const accessCode = directorCode || generateDirectorAccessCode()

    // Save report with director access
    const { reportId } = await saveReportWithDirectorAccess(
      reportAnalysis,
      intakeId,
      userId,
      accessCode
    )

    console.log(`📄 Report saved with ID: ${reportId}, Access Code: ${accessCode}`)

    // TODO: Send notification to director with access code
    // This would be implemented as:
    // 1. Match family with suitable directors based on report analysis
    // 2. Send secure notification with access code
    // 3. Track director access and engagement

    return NextResponse.json({ 
      success: true, 
      reportId: reportId,
      accessCode: accessCode,
      message: "Comprehensive report generated successfully",
      analysis: {
        summary: reportAnalysis.summary,
        urgencyLevel: reportAnalysis.urgencyLevel,
        preferredContact: reportAnalysis.preferredContact
      }
    })

  } catch (error) {
    console.error('❌ Error generating enhanced intake report:', error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// New endpoint to get director report access
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accessCode = searchParams.get('code')

    if (!accessCode) {
      return NextResponse.json({ error: "Access code required" }, { status: 400 })
    }

    const supabase = getServiceSupabaseClient()

    // Validate access code and get report
    const { data: reportAccess, error: accessError } = await supabase
      .from('report_access')
      .select(`
        *,
        intake_reports(
          id,
          report_data,
          created_at
        )
      `)
      .eq('access_code', accessCode)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (accessError || !reportAccess) {
      return NextResponse.json({ error: "Invalid or expired access code" }, { status: 404 })
    }

    // Log access for analytics
    await supabase
      .from('report_access')
      .update({ 
        last_accessed_at: new Date().toISOString(),
        access_count: (reportAccess.access_count || 0) + 1
      })
      .eq('id', reportAccess.id)

    return NextResponse.json({
      success: true,
      report: reportAccess.intake_reports,
      accessInfo: {
        accessType: reportAccess.access_type,
        expiresAt: reportAccess.expires_at,
        accessCount: (reportAccess.access_count || 0) + 1
      }
    })

  } catch (error) {
    console.error('Error accessing director report:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}