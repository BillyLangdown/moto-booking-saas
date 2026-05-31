'use client'

import type { Booking } from '@/types'
import Badge from '@/components/ui/Badge'

interface Props {
  bookings: Booking[]
  onSelect: (booking: Booking) => void
}

function formatDateHeading(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00`)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
}

function formatBookedOn(iso: string) {
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

  // Group by slot date, fall back to createdAt date for bookings without a slot
  const grouped = bookings.reduce<Record<string, Booking[]>>((acc, b) => {
    const key = b.slot?.date ?? b.createdAt.split('T')[0]
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(grouped)
        .sort(([a], [b]) => b.localeCompare(a)) // newest first
        .map(([date, dateBookings]) => (
          <div key={date} className="bg-white shadow-sm overflow-hidden">
            {/* Date heading */}
            <div className="border-b border-border bg-subtle px-5 py-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                {formatDateHeading(date)}
              </p>
              <p className="text-xs text-muted">
                {dateBookings.length} booking{dateBookings.length !== 1 ? 's' : ''}
              </p>
            </div>

            <ul className="divide-y divide-border/50">
              {dateBookings.map((b) => (
                <li
                  key={b.id}
                  onClick={() => onSelect(b)}
                  className="px-5 py-4 cursor-pointer hover:bg-subtle/60 transition-colors"
                >
                  {/* Top row: name + status */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="font-semibold text-sm text-ink truncate">{b.name}</p>
                    <Badge variant="status" value={b.status} />
                  </div>

                  {/* Bottom row: time, service, resource */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {b.slot?.startTime && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-ink">
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
                          <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.1"/>
                          <path d="M5.5 3v2.5l1.5 1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                        </svg>
                        {b.slot.startTime}–{b.slot.endTime}
                      </span>
                    )}
                    {b.sessionType && (
                      <Badge variant="session" value={b.sessionType} />
                    )}
                    {b.resourceName && (
                      <span className="text-xs text-secondary">{b.resourceName}</span>
                    )}
                    {!b.slot?.startTime && (
                      <span className="text-xs text-muted">Booked {formatBookedOn(b.createdAt)}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  )
}
