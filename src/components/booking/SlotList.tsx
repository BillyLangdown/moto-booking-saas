'use client'

import { useState } from 'react'
import type { AvailabilitySlot, LicenceType } from '@/types'
import SlotCard from '@/components/booking/SlotCard'

const LICENCE_TYPES: LicenceType[] = ['CBT', 'A1', 'A2', 'DAS', 'Refresher']

interface Props {
  slots: AvailabilitySlot[]
  onSelect: (slot: AvailabilitySlot) => void
}

function formatDateHeading(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`)
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function SlotList({ slots, onSelect }: Props) {
  const [filter, setFilter] = useState<LicenceType | 'All'>('All')

  const filtered = filter === 'All' ? slots : slots.filter((s) => s.licenceType === filter)

  // Group by date
  const grouped = filtered.reduce<Record<string, AvailabilitySlot[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = []
    acc[slot.date].push(slot)
    return acc
  }, {})

  const presentTypes = new Set(slots.map((s) => s.licenceType))

  return (
    <div className="flex flex-col gap-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(['All', ...LICENCE_TYPES.filter((l) => presentTypes.has(l))] as (LicenceType | 'All')[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={[
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filter === t
                ? 'bg-accent text-white'
                : 'bg-white border border-border text-secondary hover:text-ink',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Slot groups */}
      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-secondary py-8 text-center">
          No available slots for this filter.
        </p>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, dateSlots]) => (
            <div key={date} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-secondary">
                {formatDateHeading(date)}
              </h3>
              <div className="flex flex-col gap-2">
                {dateSlots.map((slot) => (
                  <SlotCard key={slot.id} slot={slot} onSelect={onSelect} />
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  )
}
