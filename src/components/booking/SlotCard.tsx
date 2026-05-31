import type { AvailabilitySlot } from '@/types'
import Badge from '@/components/ui/Badge'

interface Props {
  slot: AvailabilitySlot
  onSelect: (slot: AvailabilitySlot) => void
}

export default function SlotCard({ slot, onSelect }: Props) {
  const available = slot.capacity - slot.booked
  const almostFull = available === 1

  return (
    <button
      onClick={() => onSelect(slot)}
      className="w-full text-left bg-white shadow-sm px-4 py-4 hover:shadow transition-all duration-150 group"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="licence" value={slot.licenceType} />
            {almostFull && (
              <span className="text-xs font-medium text-amber-600">Last space</span>
            )}
          </div>
          <p className="text-base font-semibold text-ink leading-tight">
            {slot.startTime} – {slot.endTime}
          </p>
          <p className="text-sm text-secondary truncate">{slot.resource.name}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-xs font-medium ${available === 0 ? 'text-rose-600' : 'text-secondary'}`}>
            {available > 0 ? `${available} space${available !== 1 ? 's' : ''} left` : 'Full'}
          </span>
          <span className="text-xs text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Book →
          </span>
        </div>
      </div>
    </button>
  )
}
