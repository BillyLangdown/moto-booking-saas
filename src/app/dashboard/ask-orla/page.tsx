import { getAuthTenant } from '@/lib/auth'
import { bookingService } from '@/services/bookingService'
import AskOrla from '@/components/admin/AskOrla'

export default async function AskOrlaPage() {
  const tenant = await getAuthTenant()
  const bookings = await bookingService.getBookings(tenant.id)

  return (
    <div className="flex min-h-full items-center justify-center py-8">
      <div className="w-full max-w-xl">
        <AskOrla bookings={bookings} />
      </div>
    </div>
  )
}
