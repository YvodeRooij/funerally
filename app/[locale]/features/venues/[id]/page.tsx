import { VenueDetailView } from "@/components/features/venues/venue-detail-view"

interface VenueDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function VenueDetailPage({ params }: VenueDetailPageProps) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-slate-50">
      <VenueDetailView venueId={id} />
    </div>
  )
}
