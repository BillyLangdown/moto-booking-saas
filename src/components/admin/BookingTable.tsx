'use client'

import { useTransition } from 'react'
import type { Booking } from '@/types'
import Badge from '@/components/ui/Badge'
import { confirmBookingAction } from '@/app/actions'

interface Props {
  bookings: Booking[]
  onSelect: (booking: Booking) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatSlotDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function ConfirmButton({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await confirmBookingAction(bookingId) })}
      className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
    >
      {pending ? 'Confirming…' : 'Confirm'}
    </button>
  )
}

export default function BookingTable({ bookings, onSelect }: Props) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white py-20 text-center">
        <p className="text-sm font-medium text-ink">No bookings yet</p>
        <p className="text-xs text-secondary mt-1">Bookings will appear here once customers start booking.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      {/* Mobile: stacked cards */}
      <ul className="divide-y divide-border sm:hidden">
        {bookings.map((b) => (
          <li key={b.id} className="p-4 flex flex-col gap-2.5 cursor-pointer active:bg-subtle/60" onClick={() => onSelect(b)}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm text-ink leading-tight">{b.name}</p>
                <p className="text-xs text-secondary mt-0.5">{b.email}</p>
              </div>
              <Badge variant="status" value={b.status} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="licence" value={b.licenceType} />
              {b.slot?.date && (
                <span className="text-xs text-secondary">{formatSlotDate(b.slot.date)}</span>
              )}
              {b.slot?.startTime && b.slot?.endTime && (
                <span className="text-xs text-secondary">{b.slot.startTime}–{b.slot.endTime}</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted">Booked {formatDate(b.createdAt)}</p>
              {b.status === 'pending' && <ConfirmButton bookingId={b.id} />}
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <table className="hidden sm:table w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-subtle text-left">
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-secondary">Customer</th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-secondary">Session</th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-secondary">Date & time</th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-secondary">Booked on</th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-secondary">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {bookings.map((b) => (
            <tr key={b.id} className="hover:bg-subtle/60 transition-colors cursor-pointer" onClick={() => onSelect(b)}>
              <td className="px-5 py-3.5">
                <p className="font-medium text-ink">{b.name}</p>
                <p className="text-xs text-secondary mt-0.5">{b.email}</p>
              </td>
              <td className="px-5 py-3.5">
                <Badge variant="licence" value={b.licenceType} />
              </td>
              <td className="px-5 py-3.5">
                {b.slot?.date ? (
                  <>
                    <p className="text-ink">{formatSlotDate(b.slot.date)}</p>
                    {b.slot.startTime && (
                      <p className="text-xs text-secondary mt-0.5">{b.slot.startTime}–{b.slot.endTime}</p>
                    )}
                  </>
                ) : (
                  <span className="text-secondary">—</span>
                )}
              </td>
              <td className="px-5 py-3.5 text-secondary">{formatDate(b.createdAt)}</td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Badge variant="status" value={b.status} />
                  {b.status === 'pending' && <ConfirmButton bookingId={b.id} />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
