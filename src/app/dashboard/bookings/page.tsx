import { bookingService } from '@/services/bookingService'
import { getAuthTenant } from '@/lib/auth'
import BookingsView from '@/components/admin/BookingsView'

export default async function BookingsPage() {
  const tenant   = await getAuthTenant()
  const bookings = await bookingService.getBookings(tenant.id)
  return <BookingsView bookings={bookings} />
}
