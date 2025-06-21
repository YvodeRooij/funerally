import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { userType, ...onboardingData } = data
    const supabase = createClient()

    // Validate user type
    if (!["family", "director", "venue"].includes(userType)) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 })
    }

    const { error } = await supabase.from("user_profiles").insert({
      user_type: userType,
      onboarding_data: onboardingData,
      onboarding_complete: true,
    })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 })
  }
}
