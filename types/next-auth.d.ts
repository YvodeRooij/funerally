export type UserRole = "family" | "director" | "venue" | "admin"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      userType?: UserRole | null
      isNewUser?: boolean
      userId?: string
      role?: UserRole
      permissions?: string[]
    }
  }

  interface User {
    userType?: UserRole | null
    isNewUser?: boolean
    role?: UserRole
    permissions?: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType?: UserRole | null
    isNewUser?: boolean
    userId?: string
    role?: UserRole
    permissions?: string[]
  }
}
