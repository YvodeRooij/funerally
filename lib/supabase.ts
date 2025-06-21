import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Export createClient for compatibility
export { createClient }

// Database types
export interface UserProfile {
  id: string
  email: string
  name: string
  user_type: "family" | "director" | "venue"
  phone?: string
  address?: string
  company?: string
  specializations?: string[]
  created_at: string
  updated_at: string
}

export interface DirectorProfile extends UserProfile {
  user_type: "director"
  kvk_number?: string
  years_experience?: number
  bio?: string
  price_range_min?: number
  price_range_max?: number
  availability?: Record<string, boolean>
}

export interface VenueProfile extends UserProfile {
  user_type: "venue"
  venue_name?: string
  venue_type?: string
  capacity?: number
  price_per_hour?: number
  minimum_hours?: number
  amenities?: string[]
  website?: string
}

export interface FamilyProfile extends UserProfile {
  user_type: "family"
  emergency_contact?: string
  family_code?: string
  connected_director?: string
  preferences?: Record<string, boolean>
}
