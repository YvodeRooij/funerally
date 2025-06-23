import { FamilyDashboard } from "@/components/family/family-dashboard"

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function FamilyDashboardPage({ params }: PageProps) {
  const { locale } = await params
  return <FamilyDashboard locale={locale} />
}
