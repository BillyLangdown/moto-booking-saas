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

function ChipRow({ label, options, value, onChange }: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  if (options.length === 0) return null
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-secondary uppercase tracking-wide">{label}</span>
      <div className="flex gap-1.5 flex-wrap">
        {['All', ...options].map(opt => {
          const active = opt === 'All' ? !value : value === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt === 'All' ? '' : opt)}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                active ? 'bg-ink text-white' : 'bg-white border border-border text-secondary hover:text-ink'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function AvailabilityView({ slots, tenantId, resources, sessionTypes }: Props) {
  const [view, setView]           = useState<View>('list')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterService,  setFilterService]  = useState('')
  const [filterResource, setFilterResource] = useState('')

  const serviceOptions  = [...new Set(slots.map(s => s.sessionType).filter(Boolean))].sort()
  const staffOptions    = resources.filter(r => r.type === 'staff').map(r => r.name)
  const locationOptions = resources.filter(r => r.type === 'location').map(r => r.name)
  const equipOptions    = resources.filter(r => r.type === 'resource').map(r => r.name)
  const hasFilters = serviceOptions.length > 0 || staffOptions.length > 0 || locationOptions.length > 0 || equipOptions.length > 0

  const filtered = slots.filter(s =>
    (!filterService  || s.sessionType   === filterService) &&
    (!filterResource || s.resource?.name === filterResource)
  )

  const activeCount = (filterService ? 1 : 0) + (filterResource ? 1 : 0)

  function clearAll() {
    setFilterService('')
    setFilterResource('')
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Controls row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center justify-between gap-2 sm:flex-none sm:justify-start">
          {hasFilters && (
            <button
              onClick={() => setFiltersOpen(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border transition-colors ${
                filtersOpen || activeCount > 0
                  ? 'bg-ink text-white border-ink'
                  : 'bg-white border-border text-secondary hover:text-ink'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1.5 3.5h11M3.5 7h7M5.5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Filter
              {activeCount > 0 && (
                <span className="flex items-center justify-center h-4 w-4 rounded-full bg-white text-ink text-xs font-bold leading-none">
                  {activeCount}
                </span>
              )}
            </button>
          )}

          <div className="flex border border-border">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'list' ? 'bg-ink text-white' : 'bg-white text-secondary hover:text-ink'}`}
            >List</button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-l border-border ${view === 'calendar' ? 'bg-ink text-white' : 'bg-white text-secondary hover:text-ink'}`}
            >Calendar</button>
          </div>
        </div>

        <div className="sm:ml-auto">
          <SlotCreateForm tenantId={tenantId} resources={resources} sessionTypes={sessionTypes} fullWidth />
        </div>
      </div>

      {/* Filter panel */}
      {filtersOpen && hasFilters && (
        <div className="bg-white shadow-sm p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Filters</span>
            {activeCount > 0 && (
              <button onClick={clearAll} className="text-xs text-secondary hover:text-ink transition-colors">
                Clear all
              </button>
            )}
          </div>
          <ChipRow label="Service"  options={serviceOptions}  value={filterService}  onChange={setFilterService} />
          <ChipRow label="Staff"    options={staffOptions}    value={filterResource} onChange={setFilterResource} />
          <ChipRow label="Location" options={locationOptions} value={filterResource} onChange={setFilterResource} />
          <ChipRow label="Equipment" options={equipOptions}   value={filterResource} onChange={setFilterResource} />
        </div>
      )}

      {view === 'list' ? (
        <AvailabilityList slots={filtered} />
      ) : (
        <AvailabilityCalendarView slots={filtered} />
      )}
    </div>
  )
}
