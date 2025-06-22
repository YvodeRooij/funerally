"use client"

import { VenueBooking } from "@/components/features/shared/venue-booking"

interface VenueBookingPageProps {
  params: { id: string }
}

export default function VenueBookingPage({ params }: VenueBookingPageProps) {
  return <VenueBooking venueId={params.id} />
}
