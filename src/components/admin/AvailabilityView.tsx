'use client'

import { useState } from 'react'
import type { AvailabilitySlot, Resource } from '@/types'
import AvailabilityList from './AvailabilityList'
import AvailabilityCalendarView from './AvailabilityCalendarView'
import SlotCreateForm from './SlotCreateForm'

interface Props {
  slots: AvailabilitySlot[]
  tenantId: string
  resources: Resource[]
  sessionTypes?: string[]
}

type View = 'list' | 'calendar'

export default function AvailabilityView({ slots, tenantId, resources, sessionTypes }: Props) {
  const [view, setView] = useState<View>('list')

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle + button row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex border border-border self-start">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'list' ? 'bg-ink text-white' : 'bg-white text-secondary hover:text-ink'}`}
          >List</button>
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-border ${view === 'calendar' ? 'bg-ink text-white' : 'bg-white text-secondary hover:text-ink'}`}
          >Calendar</button>
        </div>
        <div className="w-full sm:w-auto">
          <SlotCreateForm tenantId={tenantId} resources={resources} sessionTypes={sessionTypes} fullWidth />
        </div>
      </div>

      {view === 'list' ? (
        <AvailabilityList slots={slots} />
      ) : (
        <AvailabilityCalendarView slots={slots} />
      )}
    </div>
  )
}
