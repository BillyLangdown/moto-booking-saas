'use client'

import type { AvailabilitySlot, Booking, Tenant } from '@/types'

interface Props {
  booking: Booking
  tenant: Pick<Tenant, 'name' | 'address'>
  slot?: Pick<AvailabilitySlot, 'date' | 'startTime' | 'endTime'>
  onBookAnother: () => void
}

export default function BookingSuccess({ booking, tenant, slot, onBookAnother }: Props) {
  const resolvedSlot = slot ?? booking.slot
  const formattedDate = resolvedSlot
    ? new Date(`${resolvedSlot.date}T00:00:00`).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : null
  const isPending = booking.status === 'pending'

  const calUrl = booking.startTimeIso && booking.endTimeIso
    ? `/calendar?${new URLSearchParams({
        title:       `${booking.sessionType ?? 'Appointment'} – ${tenant.name}`,
        start:       booking.startTimeIso,
        end:         booking.endTimeIso,
        description: `Booking with ${tenant.name}. Ref: ${booking.id}`,
        ...(tenant.address ? { location: tenant.address } : {}),
      })}`
    : null

  const ref = booking.id.slice(0, 8).toUpperCase()

  return (
    <div className="flex flex-col gap-12 py-4">

      {/* Hero */}
      <div className="flex flex-col gap-6">
        {/* Status mark — geometric circle with inner ring */}
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-accent/20" />
          <div className="absolute inset-[5px] rounded-full border border-accent/30" />
          <div className="w-2 h-2 rounded-full bg-accent" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] font-semibold text-ink leading-tight tracking-[-0.02em]">
            {isPending ? 'Request sent.' : "You're booked."}
          </h1>
          <p className="text-sm text-secondary leading-relaxed">
            {isPending
              ? `Your request is with ${tenant.name}. You'll hear back once it's confirmed.`
              : `A confirmation has been sent to ${booking.email}.`}
          </p>
        </div>
      </div>

      {/* Detail card — physical receipt style */}
      <div className="flex flex-col">
        {/* Top rule */}
        <div className="flex items-center gap-2 pb-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-mono text-muted tracking-widest">REF {ref}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex flex-col gap-4">
          {formattedDate && (
            <DetailRow label="Date" value={formattedDate} />
          )}
          {resolvedSlot?.startTime && (
            <DetailRow label="Time" value={`${resolvedSlot.startTime} – ${resolvedSlot.endTime}`} />
          )}
          {booking.sessionType && (
            <DetailRow label="Service" value={booking.sessionType} />
          )}
          {tenant.address && (
            <DetailRow label="Location" value={tenant.address} align="start" />
          )}
          {booking.resourceName && (
            <DetailRow label="With" value={booking.resourceName} />
          )}
        </div>

        {/* Bottom rule */}
        <div className="mt-5 h-px bg-border" />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {!isPending && calUrl && (
          <a
            href={calUrl}
            className="flex items-center justify-center gap-2 bg-card border border-border rounded-xl px-4 py-3.5 text-sm font-medium text-ink hover:bg-subtle transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <rect x="1.5" y="2.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M1.5 6h12M5 1.5v2M10 1.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Add to calendar
          </a>
        )}
        <button
          onClick={onBookAnother}
          className="text-sm text-secondary hover:text-ink transition-colors text-center py-3"
        >
          Book another time
        </button>
      </div>

    </div>
  )
}

function DetailRow({
  label,
  value,
  align = 'center',
}: {
  label: string
  value: string
  align?: 'center' | 'start'
}) {
  return (
    <div className={`flex justify-between gap-4 ${align === 'start' ? 'items-start' : 'items-center'}`}>
      <span className="text-xs text-muted shrink-0 w-16">{label}</span>
      <span className="text-sm font-medium text-ink text-right flex-1">{value}</span>
    </div>
  )
}
