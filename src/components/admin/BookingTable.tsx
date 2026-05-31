'use client'

import type { Booking } from '@/types'
import Badge from '@/components/ui/Badge'

interface Props {
  bookings: Booking[]
  onSelect: (booking: Booking) => void
}

function formatSlotDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  })
}

function formatCreated(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BookingTable({ bookings, onSelect }: Props) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white shadow-sm py-20 text-center">
        <p className="text-sm font-medium text-ink">No bookings yet</p>
        <p className="text-xs text-secondary mt-1">Bookings will appear here once customers start booking.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm divide-y divide-border/50">
      {bookings.map((b) => (
        <div
          key={b.id}
          onClick={() => onSelect(b)}
          className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-subtle/60 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-ink truncate">{b.name}</p>
            <p className="text-xs text-secondary mt-0.5">
              {b.slot?.date ? formatSlotDate(b.slot.date) : formatCreated(b.createdAt)}
              {b.slot?.startTime ? ` · ${b.slot.startTime}–${b.slot.endTime}` : ''}
              {b.resourceName ? ` · ${b.resourceName}` : ''}
            </p>
          </div>
          <div className="hidden sm:block shrink-0">
            <Badge variant="licence" value={b.licenceType} />
          </div>
          <Badge variant="status" value={b.status} />
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-muted">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      ))}
    </div>
  )
}
