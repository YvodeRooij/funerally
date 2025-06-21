import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile from Supabase
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("email", session.user.email)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile: profile || null,
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userType, name, phone, company, address, ...otherData } = body

    // Upsert user profile in Supabase
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          email: session.user.email,
          name: name || session.user.name,
          user_type: userType,
          phone,
          company,
          address,
          ...otherData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "email",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userType, name, phone, company, address, specialization } = body

    // Create new user profile in Supabase
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .insert({
        email: session.user.email,
        name: name || session.user.name,
        user_type: userType,
        phone,
        company,
        address,
        specializations: specialization ? [specialization] : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    console.error("Profile creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
