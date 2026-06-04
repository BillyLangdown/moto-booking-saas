'use client'

import type { Booking, Tenant } from '@/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface Props {
  booking: Booking
  tenant: Pick<Tenant, 'name' | 'address'>
  onBookAnother: () => void
}

export default function BookingSuccess({ booking, tenant, onBookAnother }: Props) {
  const isPending = booking.status === 'pending'

  const calUrl = booking.startTimeIso && booking.endTimeIso
    ? `/calendar?${new URLSearchParams({
        title:       `${booking.sessionType} – ${tenant.name}`,
        start:       booking.startTimeIso,
        end:         booking.endTimeIso,
        description: `Booking with ${tenant.name}. Ref: ${booking.id}`,
        ...(tenant.address ? { location: tenant.address } : {}),
      })}`
    : null

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
        <h2 className="text-xl font-semibold text-ink">
          {isPending ? 'Request sent!' : 'Booking confirmed!'}
        </h2>
        <p className="text-sm text-secondary max-w-xs">
          {isPending
            ? <>Your request has been sent to <strong>{tenant.name}</strong>. You&apos;ll receive a confirmation email once it&apos;s approved.</>
            : <>A confirmation email with a calendar invite has been sent to <strong>{booking.email}</strong>.</>
          }
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
          <span className="text-xs text-secondary">Session type</span>
          <Badge variant="session" value={booking.sessionType} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-secondary">Status</span>
          <Badge variant="status" value={booking.status} />
        </div>
      </div>

      {!isPending && calUrl && (
        <a
          href={calUrl}
          className="w-full flex items-center justify-center gap-2 border border-border bg-white px-4 py-3 text-sm font-medium text-ink hover:bg-gray-50 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Add to Calendar
        </a>
      )}

      <Button variant="secondary" onClick={onBookAnother}>
        Book another slot
      </Button>
    </div>
  )
}
