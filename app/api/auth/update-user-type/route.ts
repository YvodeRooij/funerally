import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-supabase"
import { getServiceSupabaseClient } from "@/lib/supabase"

interface UpdateUserTypeRequest {
  userType: "family" | "director" | "venue"
  userId: string
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Niet geautoriseerd" },
        { status: 401 }
      )
    }

    const body: UpdateUserTypeRequest = await request.json()
    const { userType, userId } = body

    // Validate required fields
    if (!userType || !userId) {
      return NextResponse.json(
        { error: "Gebruikerstype en gebruikers-ID zijn verplicht" },
        { status: 400 }
      )
    }

    // Validate user type
    if (!["family", "director", "venue"].includes(userType)) {
      return NextResponse.json(
        { error: "Ongeldig gebruikerstype" },
        { status: 400 }
      )
    }

    // Verify user owns this account
    if (session.user.userId !== userId) {
      return NextResponse.json(
        { error: "Niet geautoriseerd om deze gebruiker bij te werken" },
        { status: 403 }
      )
    }

    const supabase = getServiceSupabaseClient()

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        user_type: userType,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      console.error("Profile update error:", profileError)
      return NextResponse.json(
        { error: "Fout bij het bijwerken van profiel" },
        { status: 500 }
      )
    }

    // Create user-specific profile table entry if it doesn't exist
    let specificProfileError = null
    
    if (userType === "director") {
      const { error } = await supabase
        .from('director_profiles')
        .upsert({ 
          id: userId,
          updated_at: new Date().toISOString()
        })
      specificProfileError = error
    } else if (userType === "venue") {
      const { error } = await supabase
        .from('venue_profiles')
        .upsert({ 
          id: userId,
          updated_at: new Date().toISOString()
        })
      specificProfileError = error
    } else if (userType === "family") {
      // Check if family profile already exists
      const { data: existingFamily } = await supabase
        .from('family_profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (!existingFamily) {
        const { error } = await supabase
          .from('family_profiles')
          .insert({ 
            id: userId,
            family_code: `FAM-${Date.now().toString().slice(-6)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        specificProfileError = error
      }
    }

    if (specificProfileError) {
      console.error("Specific profile creation/update error:", specificProfileError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      userType,
      message: "Gebruikerstype succesvol bijgewerkt"
    })

  } catch (error) {
    console.error("Update user type API error:", error)
    return NextResponse.json(
      { error: "Er is een interne fout opgetreden" },
      { status: 500 }
    )
  }
}