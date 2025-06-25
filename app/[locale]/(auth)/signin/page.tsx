"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SignInPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to new unified auth flow
    router.replace("/auth")
  }, [router])

  // Return loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Doorverwijzen...</p>
      </div>
    </div>
  )
}
