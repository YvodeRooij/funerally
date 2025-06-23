import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-supabase"
import { getServiceSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userType = (session.user as any).userType
    if (userType !== "family") {
      return NextResponse.json({ hasIncompleteIntake: false })
    }

    const supabase = getServiceSupabaseClient()

    // Check for incomplete intakes
    const { data: incompleteIntake, error } = await supabase
      .from('family_intakes')
      .select('id, current_step, created_at')
      .eq('user_id', session.user.id)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking intake:', error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({
      hasIncompleteIntake: !!incompleteIntake,
      intakeId: incompleteIntake?.id,
      currentStep: incompleteIntake?.current_step
    })

  } catch (error) {
    console.error('Error in check-intake:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}