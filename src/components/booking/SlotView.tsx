'use client'

import { useState } from 'react'
import type { AvailabilitySlot } from '@/types'
import SlotList from './SlotList'
import BookingCalendar from './BookingCalendar'

type View = 'list' | 'calendar'

interface Props {
  slots: AvailabilitySlot[]
  onSelect: (slot: AvailabilitySlot) => void
}

export default function SlotView({ slots, onSelect }: Props) {
  const [view, setView] = useState<View>('list')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex self-end border border-border">
        <button
          onClick={() => setView('list')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            view === 'list' ? 'bg-ink text-white' : 'bg-white text-secondary hover:text-ink'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5h10M2 7h10M2 10.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          List
        </button>
        <button
          onClick={() => setView('calendar')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-l border-border ${
            view === 'calendar' ? 'bg-ink text-white' : 'bg-white text-secondary hover:text-ink'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1.5" y="2.5" width="11" height="10" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M1.5 5.5h11M4.5 1.5v2M9.5 1.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Calendar
        </button>
      </div>

      {view === 'list' ? (
        <SlotList slots={slots} onSelect={onSelect} />
      ) : (
        <BookingCalendar slots={slots} onSelect={onSelect} />
      )}
    </div>
  )
}
