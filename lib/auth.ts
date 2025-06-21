import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import type { UserRole } from "@/types/next-auth"

// Mock user database - replace with actual database integration
const users = [
  {
    id: "1",
    email: "admin@farewelly.com",
    password: "$2a$12$K3lKW9pxGOgfzlJ9z8h7...", // "admin123" hashed
    name: "Admin User",
    role: "admin" as UserRole,
    permissions: ["*"]
  }
]

// Define role-based permissions
const ROLE_PERMISSIONS = {
  admin: ["*"], // Full access
  director: ["manage_services", "view_clients", "manage_bookings", "view_analytics"],
  venue: ["manage_venue", "view_bookings", "manage_availability", "view_analytics"],
  family: ["view_services", "create_booking", "manage_profile", "view_memorials"]
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "email"
        }
      }
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

        // Find user in database (replace with actual database query)
        const user = users.find(u => u.email === credentials.email)
        
        if (!user) {
          throw new Error("Invalid email or password")
        }

        // Verify password (replace with actual password verification)
        const isPasswordValid = await compare(credentials.password, user.password)
        
        if (!isPasswordValid) {
          throw new Error("Invalid email or password")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.role,
          role: user.role,
          permissions: user.permissions
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
      }

      // Handle session update
      if (trigger === "update" && session) {
        token.userType = session.userType
        token.role = session.role
        token.permissions = session.permissions
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
    async signIn({ user, account, profile, email, credentials }) {
      // Allow sign in for OAuth providers
      if (account?.provider === "google" || account?.provider === "facebook") {
        return true
      }
      
      // Allow sign in for credentials
      if (account?.provider === "credentials") {
        return true
      }
      
      return true
    },
    async redirect({ url, baseUrl }) {
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
    signIn: "/auth/signin",
    newUser: "/auth/onboarding",
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
        // Add user to database here
      }
    },
    async signOut({ session, token }) {
      console.log("User signed out:", session?.user?.email)
    }
  },
  debug: process.env.NODE_ENV === "development",
}
