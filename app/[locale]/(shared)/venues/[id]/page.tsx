"use client"

import { VenueDetail } from "@/components/features/shared/venue-detail"

interface VenueDetailPageProps {
  params: { id: string }
}

export default function VenueDetailPage({ params }: VenueDetailPageProps) {
  return <VenueDetail venueId={params.id} />
}
