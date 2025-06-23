import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import LinkedInProvider from "next-auth/providers/linkedin"
import CredentialsProvider from "next-auth/providers/credentials"
import { SupabaseAdapter } from "@next-auth/supabase-adapter"
import { getServiceSupabaseClient } from "./supabase"
import type { UserRole } from "@/types/next-auth"

// Define role-based permissions
const ROLE_PERMISSIONS = {
  admin: ["*"], // Full access
  director: ["manage_services", "view_clients", "manage_bookings", "view_analytics"],
  venue: ["manage_venue", "view_bookings", "manage_availability", "view_analytics"],
  family: ["view_services", "create_booking", "manage_profile", "view_memorials"]
}

export const authOptions: NextAuthOptions = {
  // Add secret for production security
  secret: process.env.NEXTAUTH_SECRET,
  
  // Use Supabase adapter when service role key is available
  ...(process.env.SUPABASE_SERVICE_ROLE_KEY && {
    adapter: SupabaseAdapter({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    }),
  }),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "REDACTED_CLIENT_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "REDACTED_CLIENT_SECRET",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      }
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || "placeholder-linkedin-id",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "placeholder-linkedin-secret",
      authorization: {
        params: {
          scope: "openid profile email"
        }
      },
      issuer: "https://www.linkedin.com",
      wellKnown: "https://www.linkedin.com/oauth/.well-known/openid_configuration"
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { 
          label: "Email", 
          type: "email", 
          placeholder: "Enter your email" 
        },
        password: { 
          label: "Password", 
          type: "password", 
          placeholder: "Enter your password" 
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          throw new Error("Supabase service role key not configured")
        }

        const supabase = getServiceSupabaseClient()
        
        // Sign in with Supabase auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })
        
        if (authError || !authData.user) {
          throw new Error("Invalid email or password")
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()
        
        if (profileError || !profile) {
          throw new Error("User profile not found")
        }

        // Get user roles
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role_id, roles(name, permissions)')
          .eq('user_id', authData.user.id)

        const primaryRole = userRoles?.[0]?.roles as any
        const permissions = primaryRole?.permissions || ROLE_PERMISSIONS[profile.user_type as UserRole] || []

        return {
          id: authData.user.id,
          email: authData.user.email!,
          name: profile.name,
          userType: profile.user_type as UserRole,
          role: profile.user_type as UserRole,
          permissions: permissions
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (account && user) {
        token.userType = user.userType || null
        token.role = user.role || user.userType || null
        token.isNewUser = !user.userType && !user.role
        token.userId = user.id
        token.permissions = user.permissions || (user.role ? ROLE_PERMISSIONS[user.role as UserRole] : [])
        
        // Store auth provider info
        token.provider = account.provider
      }

      // Handle session update
      if (trigger === "update" && session) {
        token.userType = session.userType
        token.role = session.role
        token.permissions = session.permissions
      }

      // For OAuth providers (Google, LinkedIn), fetch profile from Supabase
      if (token.provider && ["google", "linkedin"].includes(token.provider) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = getServiceSupabaseClient()
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, user_roles(role_id, roles(name, permissions))')
          .eq('id', token.userId)
          .single()
        
        if (profile) {
          token.userType = profile.user_type as UserRole
          token.role = profile.user_type as UserRole
          token.isNewUser = !profile.user_type
          const primaryRole = profile.user_roles?.[0]?.roles as any
          token.permissions = primaryRole?.permissions || ROLE_PERMISSIONS[profile.user_type as UserRole] || []
        }
      }

      return token
    },
    async session({ session, token }) {
      // Pass user info to session
      session.user.userType = token.userType as UserRole | null
      session.user.role = token.role as UserRole
      session.user.isNewUser = token.isNewUser as boolean
      session.user.userId = token.userId as string
      session.user.permissions = token.permissions as string[]
      
      return session
    },
    async signIn({ user, account, profile }) {
      // For OAuth providers, ensure user exists in Supabase
      if ((account?.provider === "google" || account?.provider === "linkedin") && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = getServiceSupabaseClient()
        
        // Check if user exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', user.email!)
          .single()
        
        // If user doesn't exist, create profile
        if (!existingUser) {
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email!,
              name: user.name || profile?.name || "",
            })
        }
      }
      
      return true
    },
    async redirect({ url, baseUrl }) {
      // Handle OAuth callback
      if (url.includes("/auth/callback")) {
        return `${baseUrl}/auth/callback`
      }
      
      // Redirect to onboarding for new users
      if (url.includes("/auth/onboarding")) {
        return `${baseUrl}/auth/onboarding`
      }
      
      // Redirect to dashboard after sign in
      if (url === baseUrl) {
        return `${baseUrl}/dashboard`
      }
      
      return url.startsWith(baseUrl) ? url : baseUrl
    }
  },
  pages: {
    signIn: "/auth",
    newUser: "/onboarding", 
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`)
      
      if (isNewUser) {
        console.log("New user signed up:", user.email)
      }
    },
    async signOut({ session, token }) {
      console.log("User signed out:", session?.user?.email)
    }
  },
  // Debug mode only if explicitly enabled via environment variable
  debug: process.env.NEXTAUTH_DEBUG === "true",
}