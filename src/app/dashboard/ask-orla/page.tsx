import { getAuthTenant } from '@/lib/auth'
import { bookingService } from '@/services/bookingService'
import { availabilityService } from '@/services/availabilityService'
import AskOrla from '@/components/admin/AskOrla'

export default async function AskOrlaPage() {
  const tenant = await getAuthTenant()
  const [allBookings, slots] = await Promise.all([
    bookingService.getBookings(tenant.id),
    availabilityService.getAllSlots(tenant.id),
  ])

  // Only send bookings from the last 90 days or future to Orla — prevents
  // stale pending/cancelled bookings from distorting AI answers
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const bookings = allBookings.filter(b => {
    if (!b.slot?.date) return true
    return new Date(b.slot.date) >= cutoff
  })

  return (
    <div className="flex min-h-full items-center justify-center py-8">
      <div className="w-full max-w-xl">
        <AskOrla bookings={bookings} slots={slots} />
      </div>
    </div>
  )
}
