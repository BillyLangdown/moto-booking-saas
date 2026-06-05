import { bookingService } from '@/services/bookingService'
import { getAuthTenant } from '@/lib/auth'
import BookingsView from '@/components/admin/BookingsView'
import BookingPageLink from '@/components/admin/BookingPageLink'

export default async function BookingsPage() {
  const tenant   = await getAuthTenant()
  const bookings = await bookingService.getBookings(tenant.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-ink">Bookings</h1>
          <p className="text-sm text-secondary mt-0.5">
            {bookings.length > 0 ? `${bookings.length} booking${bookings.length !== 1 ? 's' : ''} total` : 'No bookings yet.'}
          </p>
        </div>
        <BookingPageLink slug={tenant.slug} />
      </div>
      <BookingsView bookings={bookings} />
    </div>
  )
}
