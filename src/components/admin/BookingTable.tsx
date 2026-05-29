import type { Booking } from '@/types'
import Badge from '@/components/ui/Badge'

interface Props {
  bookings: Booking[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function BookingTable({ bookings }: Props) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white py-16 text-center">
        <p className="text-sm text-secondary">No bookings yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      {/* Mobile: stacked cards */}
      <ul className="divide-y divide-border sm:hidden">
        {bookings.map((b) => (
          <li key={b.id} className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-ink">{b.name}</span>
              <Badge variant="status" value={b.status} />
            </div>
            <p className="text-xs text-secondary">{b.email}</p>
            <div className="flex items-center gap-2">
              <Badge variant="licence" value={b.licenceType} />
              <span className="text-xs text-secondary">{formatDate(b.createdAt)}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <table className="hidden sm:table w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-subtle text-left">
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-secondary">Customer</th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-secondary">Course</th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-secondary">Slot&nbsp;ID</th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-secondary">Booked on</th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-secondary">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {bookings.map((b) => (
            <tr key={b.id} className="hover:bg-subtle transition-colors">
              <td className="px-5 py-3.5">
                <p className="font-medium text-ink">{b.name}</p>
                <p className="text-xs text-secondary">{b.email}</p>
              </td>
              <td className="px-5 py-3.5">
                <Badge variant="licence" value={b.licenceType} />
              </td>
              <td className="px-5 py-3.5 font-mono text-xs text-secondary">{b.slotId}</td>
              <td className="px-5 py-3.5 text-secondary">{formatDate(b.createdAt)}</td>
              <td className="px-5 py-3.5">
                <Badge variant="status" value={b.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
