import type { AvailabilitySlot } from '@/types'
import Badge from '@/components/ui/Badge'

interface Props {
  slot: AvailabilitySlot
  onSelect: (slot: AvailabilitySlot) => void
}

function formatTime(t: string) {
  // t is "HH:mm" — keep as-is for UK 24h display
  return t
}

export default function SlotCard({ slot, onSelect }: Props) {
  const available = slot.capacity - slot.booked
  const almostFull = available === 1

  return (
    <button
      onClick={() => onSelect(slot)}
      className="w-full text-left rounded-xl border border-border bg-white p-4 hover:border-accent hover:shadow-md transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="licence" value={slot.licenceType} />
            {almostFull && (
              <span className="text-xs text-amber-600 font-medium">Last space</span>
            )}
          </div>
          <p className="text-sm font-semibold text-ink">
            {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
          </p>
          <p className="text-sm text-secondary">
            {slot.resource.type === 'instructor' ? '👤' : '🏍️'} {slot.resource.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-secondary">{available} space{available !== 1 ? 's' : ''} left</span>
          <span className="text-xs text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Book →
          </span>
        </div>
      </div>
    </button>
  )
}
