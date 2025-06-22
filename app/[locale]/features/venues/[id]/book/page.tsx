import { VenueBookingFlow } from "@/components/features/bookings/venue-booking-flow"

interface VenueBookingPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function VenueBookingPage({ params }: VenueBookingPageProps) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-slate-50">
      <VenueBookingFlow venueId={id} />
    </div>
  )
}
