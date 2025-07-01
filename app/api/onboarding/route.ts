import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { userType, directorCode, hasDirectorCode, ...onboardingData } = data
    const supabase = createClient()

    // Validate user type
    if (!["family", "director", "venue"].includes(userType)) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 })
    }

    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Prepare profile data
    const profileData = {
      user_id: user.id,
      user_type: userType,
      onboarding_data: onboardingData,
      onboarding_complete: true,
    }

    // Handle director code connection for families
    if (userType === "family" && hasDirectorCode && directorCode) {
      // Validate director code format
      const isValidFormat = /^[A-Z]{2,5}-\d{4}-\d{3}$/.test(directorCode)
      if (!isValidFormat) {
        return NextResponse.json({ error: "Invalid director code format" }, { status: 400 })
      }

      // For production: lookup actual director by code
      // For now, simulate the connection
      const mockValidCodes = [
        { code: 'VDB-2024-001', directorId: 'mock-director-1' },
        { code: 'JAN-2024-002', directorId: 'mock-director-2' },
        { code: 'DELA-2024-003', directorId: 'mock-director-3' },
        { code: 'WIT-2024-004', directorId: 'mock-director-4' }
      ]

      const foundCode = mockValidCodes.find(c => c.code === directorCode)
      if (!foundCode) {
        return NextResponse.json({ error: "Director code not found or expired" }, { status: 400 })
      }

      // Add director connection to profile data
      profileData.onboarding_data = {
        ...onboardingData,
        family_code: directorCode,
        connected_director_id: foundCode.directorId,
        connection_established_at: new Date().toISOString()
      }
    }

    const { error } = await supabase.from("user_profiles").upsert(profileData, {
      onConflict: 'user_id'
    })

    if (error) throw error

    // If family connected to director, create director-client relationship
    if (userType === "family" && hasDirectorCode && directorCode) {
      // In production, this would create an entry in director_clients table
      console.log(`Family ${user.id} connected to director via code ${directorCode}`)
    }

    return NextResponse.json({ 
      success: true,
      directorConnected: !!(hasDirectorCode && directorCode)
    })
  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 })
  }
}
