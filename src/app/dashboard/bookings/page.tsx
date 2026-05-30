import { bookingService } from '@/services/bookingService'
import { getAuthTenant } from '@/lib/auth'
import BookingsView from '@/components/admin/BookingsView'

export default async function BookingsPage() {
  const tenant   = await getAuthTenant()
  const bookings = await bookingService.getBookings(tenant.id)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">Bookings</h1>
        <p className="text-sm text-secondary mt-0.5">
          {bookings.length > 0 ? `${bookings.length} total` : 'No bookings yet.'}
        </p>
      </div>
      <BookingsView bookings={bookings} />
    </div>
  )
}
