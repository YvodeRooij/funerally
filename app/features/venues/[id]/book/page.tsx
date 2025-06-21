import { VenueBookingFlow } from "@/components/features/bookings/venue-booking-flow"

interface VenueBookingPageProps {
  params: {
    id: string
  }
}

export default function VenueBookingPage({ params }: VenueBookingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <VenueBookingFlow venueId={params.id} />
    </div>
  )
}
