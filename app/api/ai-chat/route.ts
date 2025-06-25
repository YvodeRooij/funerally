import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-supabase"
import { getEnhancedFuneralPlanningResponse } from "@/lib/agents/funeral-planning-agent-enhanced"
import { supabase, getServiceSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // For demo purposes, allow unauthenticated access but limit functionality
    const isAuthenticated = !!session?.user?.id
    const userId = session?.user?.id

    const { message, currentStep, stepName, formData, intakeId, chatHistory } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Get AI response using Enhanced LangGraph agent with MCP tools
    const response = await getEnhancedFuneralPlanningResponse(
      message,
      currentStep || 0,
      stepName || "Unknown Step",
      formData || {},
      intakeId,
      userId,
      chatHistory || []
    )

    // Save the conversation to database if authenticated and intakeId is provided
    if (isAuthenticated && intakeId) {
      try {
        // Use service client for database operations
        const serviceSupabase = getServiceSupabaseClient()
        
        // Save user message
        await serviceSupabase
          .from('intake_chat_history')
          .insert({
            intake_id: intakeId,
            message: message,
            type: 'user',
            context: {
              step: currentStep,
              stepName: stepName
            },
            created_at: new Date().toISOString()
          })

        // Save AI response
        await serviceSupabase
          .from('intake_chat_history')
          .insert({
            intake_id: intakeId,
            message: response,
            type: 'assistant',
            context: {
              step: currentStep,
              stepName: stepName
            },
            created_at: new Date().toISOString()
          })
      } catch (dbError) {
        console.error('Error saving chat to database:', dbError)
        // Continue even if database save fails
      }
    }

    return NextResponse.json({ 
      response,
      success: true,
      authenticated: isAuthenticated,
      savedToDb: isAuthenticated && !!intakeId
    })

  } catch (error) {
    console.error('Error in AI chat API:', error)
    
    // Return a helpful fallback response
    const fallbackResponse = "Excuses, ik ondervind momenteel technische problemen. Kunt u uw vraag opnieuw stellen? Als dit probleem aanhoudt, kunt u ook direct contact opnemen met onze klantenservice."
    
    return NextResponse.json({ 
      response: fallbackResponse,
      success: false,
      error: "AI service temporarily unavailable"
    }, { status: 200 }) // Return 200 so the frontend can show the fallback
  }
}