import { ClientDetailView } from "@/components/features/clients/client-detail-view"

interface ClientDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ClientDetailView clientId={id} />
    </div>
  )
}
