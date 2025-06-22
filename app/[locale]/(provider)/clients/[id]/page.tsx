"use client"

import { ClientDetail } from "@/components/features/provider/client-detail"

interface ClientDetailPageProps {
  params: { id: string }
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  return <ClientDetail clientId={params.id} />
}
