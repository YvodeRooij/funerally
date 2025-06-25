import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabaseClient } from "@/lib/supabase"

interface SignUpRequest {
  email: string
  password: string
  name: string
  userType: "family" | "director" | "venue"
}

export async function POST(request: NextRequest) {
  try {
    const body: SignUpRequest = await request.json()
    const { email, password, name, userType } = body

    // Validate required fields
    if (!email || !password || !name || !userType) {
      return NextResponse.json(
        { error: "Alle velden zijn verplicht" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Ongeldig e-mailadres formaat" },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Wachtwoord moet minstens 6 karakters lang zijn" },
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

    const supabase = getServiceSupabaseClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: "Dit e-mailadres is al geregistreerd" },
        { status: 409 }
      )
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        user_type: userType
      },
      email_confirm: true // Set to false in development, true in production
    })

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json(
        { error: authError.message || "Fout bij het aanmaken van account" },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Geen gebruikersgegevens ontvangen" },
        { status: 400 }
      )
    }

    // Create profile in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        name,
        user_type: userType
      })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      // Don't return error here as auth user was already created
    }

    // Create user-specific profile table entry
    let specificProfileError = null
    
    if (userType === "director") {
      const { error } = await supabase
        .from('director_profiles')
        .upsert({ id: authData.user.id })
      specificProfileError = error
    } else if (userType === "venue") {
      const { error } = await supabase
        .from('venue_profiles')
        .upsert({ id: authData.user.id })
      specificProfileError = error
    } else if (userType === "family") {
      const { error } = await supabase
        .from('family_profiles')
        .upsert({ 
          id: authData.user.id,
          family_code: `FAM-${Date.now().toString().slice(-6)}`
        })
      specificProfileError = error
    }

    if (specificProfileError) {
      console.error("Specific profile creation error:", specificProfileError)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        userType,
        needsEmailConfirmation: !authData.user.email_confirmed_at
      }
    })

  } catch (error) {
    console.error("Signup API error:", error)
    return NextResponse.json(
      { error: "Er is een interne fout opgetreden" },
      { status: 500 }
    )
  }
}