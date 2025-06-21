"use client"

import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/lib/auth-context"
import type { Session } from "next-auth"

interface AuthProvidersProps {
  children: React.ReactNode
  session?: Session | null
}

export function AuthProviders({ children, session }: AuthProvidersProps) {
  return (
    <SessionProvider session={session}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  )
}