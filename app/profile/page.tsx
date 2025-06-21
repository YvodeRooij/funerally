import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { FamilyProfile } from "@/components/profile/family-profile"
import { DirectorProfile } from "@/components/profile/director-profile"
import { VenueProfile } from "@/components/profile/venue-profile"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Route to appropriate profile based on user type
  switch (session.user.userType) {
    case "family":
      return <FamilyProfile user={session.user} />
    case "director":
      return <DirectorProfile user={session.user} />
    case "venue":
      return <VenueProfile user={session.user} />
    default:
      redirect("/auth/onboarding")
  }
}
