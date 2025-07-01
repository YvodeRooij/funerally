import { NextRequest, NextResponse } from "next/server"
import { isDemoMode, getDemoReportData, DEMO_MODE } from "@/lib/demo-mode"
import { generateComprehensiveReport } from "@/lib/agents/report-generation-agent"

export async function POST(request: NextRequest) {
  // Only allow in demo mode
  if (!isDemoMode()) {
    return NextResponse.json({ error: "Demo mode not enabled" }, { status: 403 })
  }

  try {
    const { formData, intakeId, userId, useLangGraph } = await request.json()

    console.log('🎭 Demo: Generating report...', { useLangGraph })

    // Use real LangGraph logic if requested
    if (useLangGraph) {
      console.log('🧠 Demo: Using real LangGraph JS + Google Gemini')
      
      try {
        // Prepare input for LangGraph agent
        const reportInput = {
          intakeData: {
            id: intakeId || 'demo-intake-123',
            form_data: formData,
            user_id: userId || 'demo-user-123',
            completed: true,
            completed_at: new Date().toISOString()
          },
          chatHistory: [], // Demo mode has no chat history stored
          userProfile: {
            id: userId || 'demo-user-123',
            email: 'demo@farewelly.dev',
            user_type: 'family'
          }
        }

        // Generate real report using LangGraph
        const reportAnalysis = await generateComprehensiveReport(reportInput)
        const accessCode = `FNR-DEMO-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

        console.log('✅ Demo: Real LangGraph report generated with code:', accessCode)

        return NextResponse.json({
          success: true,
          reportId: 'demo-report-langgraph-' + Date.now(),
          accessCode: accessCode,
          message: "Demo rapport gegenereerd met LangGraph JS",
          analysis: reportAnalysis,
          isDemoMode: true,
          usedLangGraph: true
        })

      } catch (langGraphError) {
        console.error('❌ Demo: LangGraph failed, falling back to mock data:', langGraphError)
        // Fall through to mock data generation
      }
    }

    // Fallback: Generate mock demo report
    console.log('🎭 Demo: Using mock report data')
    
    // Simulate report generation delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Generate demo report with form data
    const reportData = getDemoReportData()
    
    // Update report with actual form data
    if (formData) {
      reportData.report_data.analysis.familySituation = `Demo familie: ${formData.deceasedName || 'Naam niet opgegeven'}, contactpersoon: ${formData.relationship || 'onbekend'}`
      reportData.report_data.analysis.funeralPreferences = formData.serviceType ? 
        `${formData.serviceType === 'burial' ? 'Begrafenis' : 'Crematie'} gewenst` : 
        'Type nog niet bepaald'
      reportData.report_data.analysis.practicalPlanning = `Geschat ${formData.attendees || 'onbekend'} gasten`
    }

    // Generate demo access code
    const accessCode = 'DEMO-123'

    console.log('✅ Demo: Mock report generated with code:', accessCode)

    return NextResponse.json({
      success: true,
      reportId: 'demo-report-mock-1',
      accessCode: accessCode,
      message: "Demo rapport gegenereerd (mock data)",
      analysis: reportData.report_data.analysis,
      isDemoMode: true,
      usedLangGraph: false
    })

  } catch (error) {
    console.error('❌ Demo: Error generating report:', error)
    return NextResponse.json(
      { error: "Demo report generation failed" },
      { status: 500 }
    )
  }
}

// Delete demo report
export async function DELETE(request: NextRequest) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "Demo mode not enabled" }, { status: 403 })
  }

  console.log('🗑️ Demo: Report deleted (simulated)')
  
  return NextResponse.json({ 
    success: true, 
    message: "Demo rapport verwijderd" 
  })
}