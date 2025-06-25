import { NextRequest, NextResponse } from "next/server"
import { isDemoMode, getDemoReportData, DEMO_MODE } from "@/lib/demo-mode"

export async function GET(request: NextRequest) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "Demo mode not enabled" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const accessCode = searchParams.get('code')

    if (!accessCode) {
      return NextResponse.json({ error: "Access code required" }, { status: 400 })
    }

    console.log('🎭 Demo: Director accessing report with code:', accessCode)

    // Validate demo codes
    const validDemoCodes = ['DEMO-123', 'TEST-456', 'SAMPLE-789']
    
    if (!validDemoCodes.includes(accessCode) && !accessCode.startsWith('DEMO-')) {
      return NextResponse.json({ 
        error: "Ongeldige demo code. Probeer: DEMO-123" 
      }, { status: 404 })
    }

    // Return demo report data
    const reportData = getDemoReportData()

    console.log('✅ Demo: Director access granted')

    return NextResponse.json({
      success: true,
      report: reportData,
      accessInfo: {
        accessType: 'director_view',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        accessCount: 1
      },
      isDemoMode: true,
      demoMessage: "Dit is een demo rapport voor test doeleinden"
    })

  } catch (error) {
    console.error('❌ Demo: Error accessing director report:', error)
    return NextResponse.json(
      { error: "Demo access failed" },
      { status: 500 }
    )
  }
}