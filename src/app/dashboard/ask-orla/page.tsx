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

  // Future bookings: always include regardless of status
  // Past bookings: only include confirmed/cancelled — pending/awaiting_payment in the
  // past are irrelevant and skew Orla's answers
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const bookings = allBookings.filter(b => {
    if (!b.slot?.date) return true
    const slotDate = new Date(b.slot.date)
    if (slotDate >= today) return true
    if (slotDate >= thirtyDaysAgo) return b.status === 'confirmed' || b.status === 'cancelled'
    return false
  })

  return (
    <div className="flex min-h-full items-center justify-center py-8">
      <div className="w-full max-w-xl">
        <AskOrla bookings={bookings} slots={slots} />
      </div>
    </div>
  )
}
