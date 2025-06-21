"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { FamilyDocuments } from "@/components/features/family/documents"
import { DocumentVault } from "@/components/features/documents/document-vault"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface DemoUser {
  id: string
  name: string
  email: string
  userType: "family" | "director" | "venue"
  onboardingComplete: boolean
}

export default function DocumentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [userType, setUserType] = useState<"family" | "director" | "venue" | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const determineUserType = async () => {
      // Check for demo user first
      const storedDemoUser = localStorage.getItem("demoUser")
      if (storedDemoUser) {
        const user: DemoUser = JSON.parse(storedDemoUser)
        setUserType(user.userType)
        setLoading(false)
        return
      }

      // Check session user type
      if (session?.user) {
        const sessionUserType = (session.user as any).userType
        if (sessionUserType) {
          setUserType(sessionUserType)
          setLoading(false)
          return
        }
      }

      // No user type found, redirect to onboarding
      router.push("/onboarding")
    }

    determineUserType()
  }, [session, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-600">Documenten laden...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render appropriate documents interface based on user type
  switch (userType) {
    case "family":
      return <FamilyDocuments />
    case "director":
    case "venue":
      return (
        <div className="min-h-screen bg-slate-50">
          <DocumentVault />
        </div>
      )
    default:
      router.push("/onboarding")
      return null
  }
}
