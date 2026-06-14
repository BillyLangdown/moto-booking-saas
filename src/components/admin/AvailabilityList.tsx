import type { AvailabilitySlot, Resource } from '@/types'
import DeleteSlotButton from '@/components/admin/DeleteSlotButton'

interface Props { slots: AvailabilitySlot[] }

function formatDateHeading(isoDate: string): string {
  const d        = new Date(`${isoDate}T00:00:00`)
  const today    = new Date()
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString())    return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
}

function slotResources(slot: AvailabilitySlot): Resource[] {
  const items: (Resource | undefined)[] = [slot.staff, slot.location, slot.equipment]
  const named = items.filter(Boolean) as Resource[]
  if (named.length > 0) return named
  return slot.resource ? [slot.resource] : []
}

export default function AvailabilityList({ slots }: Props) {
  if (slots.length === 0) {
    return (
      <div className="py-14 text-center">
        <p className="text-sm text-secondary">No slots here.</p>
        <p className="text-xs text-muted mt-1">Use the button above to schedule availability.</p>
      </div>
    )
  }

  const grouped = slots.reduce<Record<string, AvailabilitySlot[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = []
    acc[s.date].push(s)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, dateSlots]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-medium uppercase tracking-widest shrink-0 text-muted">
                {formatDateHeading(date)}
              </span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            <div className="flex flex-col gap-2">
              {dateSlots
                .sort((a, b) => a.startTime < b.startTime ? -1 : 1)
                .map(slot => {
                  const isFull = slot.booked >= slot.capacity
                  const resources = slotResources(slot)
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center gap-3 bg-card border border-border/70 rounded-xl px-4 py-3.5"
                    >
                      {/* Time */}
                      <span className="text-sm font-semibold tabular-nums text-ink shrink-0 w-[104px]">
                        {slot.startTime}
                        <span className="text-muted font-normal"> – {slot.endTime}</span>
                      </span>

                      {/* Service + resources */}
                      <div className="flex-1 min-w-0 text-sm text-secondary truncate">
                        {[
                          slot.sessionType || null,
                          ...resources.map(r => r.name),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>

                      {/* Capacity */}
                      <span className={`text-xs tabular-nums shrink-0 ${isFull ? 'text-muted line-through' : 'text-muted'}`}>
                        {slot.booked}/{slot.capacity}
                      </span>

                      <DeleteSlotButton slotId={slot.id} hasBookings={slot.booked > 0} />
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
    </div>
  )
}
