'use client'

import { useState } from 'react'
import type { AvailabilitySlot } from '@/types'
import AvailabilityList from './AvailabilityList'
import AvailabilityCalendarView from './AvailabilityCalendarView'

interface Props {
  slots: AvailabilitySlot[]
}

type View = 'list' | 'calendar'

export default function AvailabilityView({ slots }: Props) {
  const [view, setView] = useState<View>('list')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex self-end border border-border">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'list' ? 'bg-ink text-white' : 'bg-white text-secondary hover:text-ink'}`}
        >List</button>
        <button
          onClick={() => setView('calendar')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-l border-border ${view === 'calendar' ? 'bg-ink text-white' : 'bg-white text-secondary hover:text-ink'}`}
        >Calendar</button>
      </div>

      {view === 'list' ? (
        <AvailabilityList slots={slots} />
      ) : (
        <AvailabilityCalendarView slots={slots} />
      )}
    </div>
  )
}
