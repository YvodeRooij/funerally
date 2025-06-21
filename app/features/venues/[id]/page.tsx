import { VenueDetailView } from "@/components/features/venues/venue-detail-view"

interface VenueDetailPageProps {
  params: {
    id: string
  }
}

export default function VenueDetailPage({ params }: VenueDetailPageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <VenueDetailView venueId={params.id} />
    </div>
  )
}
