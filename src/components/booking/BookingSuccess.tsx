import type { Booking } from '@/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface Props {
  booking: Booking
  onBookAnother: () => void
}

export default function BookingSuccess({ booking, onBookAnother }: Props) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-8">
      <div className="flex h-14 w-14 items-center justify-center bg-emerald-100">
        <svg
          className="h-7 w-7 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-ink">Booking confirmed!</h2>
        <p className="text-sm text-secondary max-w-xs">
          A confirmation email has been sent to <strong>{booking.email}</strong>.
        </p>
      </div>

      <div className="w-full bg-white shadow-sm p-4 text-left flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-secondary">Booking ref</span>
          <span className="text-xs font-mono text-ink">{booking.id}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-secondary">Name</span>
          <span className="text-sm text-ink">{booking.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-secondary">Email</span>
          <span className="text-sm text-ink">{booking.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-secondary">Course</span>
          <Badge variant="licence" value={booking.licenceType} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-secondary">Status</span>
          <Badge variant="status" value={booking.status} />
        </div>
      </div>

      <Button variant="secondary" onClick={onBookAnother}>
        Book another slot
      </Button>
    </div>
  )
}
