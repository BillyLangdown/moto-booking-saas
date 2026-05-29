import { bookingService } from '@/services/bookingService'
import BookingTable from '@/components/admin/BookingTable'

// Demo: hardcoded to tenant_001. Will come from auth session when Supabase is added.
const DEMO_TENANT_ID = '7e72666f-53ac-4080-b27b-14073217bab4'

export default async function BookingsPage() {
  const bookings = await bookingService.getBookings(DEMO_TENANT_ID)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Bookings</h1>
          <p className="text-sm text-secondary mt-0.5">{bookings.length} total</p>
        </div>
      </div>
      <BookingTable bookings={bookings} />
    </div>
  )
}
