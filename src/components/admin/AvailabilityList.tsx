import type { AvailabilitySlot } from '@/types'
import Badge from '@/components/ui/Badge'
import DeleteSlotButton from '@/components/admin/DeleteSlotButton'

interface Props {
  slots: AvailabilitySlot[]
}

function formatDateHeading(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function CapacityBar({ booked, capacity }: { booked: number; capacity: number }) {
  const pct = Math.round((booked / capacity) * 100)
  const colour =
    pct >= 100 ? 'bg-rose-400' : pct >= 50 ? 'bg-amber-400' : 'bg-green-400'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs text-secondary">{booked}/{capacity}</span>
    </div>
  )
}

export default function AvailabilityList({ slots }: Props) {
  if (slots.length === 0) {
    return (
      <div className="bg-white shadow-sm py-16 text-center">
        <p className="text-sm text-secondary">No availability slots configured.</p>
      </div>
    )
  }

  const grouped = slots.reduce<Record<string, AvailabilitySlot[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = []
    acc[s.date].push(s)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, dateSlots]) => (
          <div key={date} className="bg-white shadow-sm overflow-hidden">
            <div className="border-b border-border bg-subtle px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                {formatDateHeading(date)}
              </p>
            </div>
            <ul className="divide-y divide-border">
              {dateSlots.map((slot) => (
                <li key={slot.id} className="px-5 py-3.5 flex items-center gap-4 flex-wrap">
                  <Badge variant="session" value={slot.sessionType} />
                  <span className="text-sm text-ink font-medium">
                    {slot.startTime} – {slot.endTime}
                  </span>
                  {slot.resource && <span className="text-sm text-secondary">{slot.resource.name}</span>}
                  <CapacityBar booked={slot.booked} capacity={slot.capacity} />
                  {slot.booked >= slot.capacity && (
                    <span className="text-xs font-medium text-rose-600">Full</span>
                  )}
                  {slot.booked < slot.capacity && (
                    <span className="text-xs text-green-600">
                      {slot.capacity - slot.booked} available
                    </span>
                  )}
                  <DeleteSlotButton slotId={slot.id} hasBookings={slot.booked > 0} />
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  )
}
