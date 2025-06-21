import { ClientDetailView } from "@/components/features/clients/client-detail-view"

interface ClientDetailPageProps {
  params: {
    id: string
  }
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <ClientDetailView clientId={params.id} />
    </div>
  )
}
