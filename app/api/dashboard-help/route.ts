import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-supabase"
import { getDashboardHelper, AgentType } from "@/lib/agents/dashboard-helpers/agent-factory"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    const { message, context, chatHistory, userType = 'family', locale = 'nl' } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Validate user type
    if (!['family', 'director', 'venue'].includes(userType)) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 })
    }

    // Get the appropriate helper based on user type and locale
    const helper = getDashboardHelper(userType as AgentType, locale)
    
    // Get response from the helper agent
    const response = await helper.getResponse(
      message,
      context || {},
      chatHistory || []
    )

    return NextResponse.json({ 
      response,
      success: true,
    })

  } catch (error) {
    console.error('Error in dashboard help API:', error)
    
    // Return a helpful fallback response
    const fallbackResponse = "Er ging iets mis. Voor directe hulp kun je bellen naar 0800-1234567 (gratis, 24/7 bereikbaar)."
    
    return NextResponse.json({ 
      response: fallbackResponse,
      success: false,
      error: "Help service temporarily unavailable"
    }, { status: 200 })
  }
}