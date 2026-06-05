'use client'

import { useState } from 'react'
import type { Booking } from '@/types'
import BookingTable from './BookingTable'
import CalendarView from './CalendarView'
import BookingDrawer from './BookingDrawer'

interface Props { bookings: Booking[] }
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

const STATUS_LABELS: Record<string, string> = {
  confirmed:        'Confirmed',
  pending:          'Pending',
  cancelled:        'Cancelled',
  awaiting_payment: 'Awaiting payment',
}

export default function BookingsView({ bookings }: Props) {
  const [view, setView]           = useState<View>('list')
  const [selected, setSelected]   = useState<Booking | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterService,  setFilterService]  = useState('')
  const [filterResource, setFilterResource] = useState('')
  const [filterStatus,   setFilterStatus]   = useState('')

  const serviceOptions  = [...new Set(bookings.map(b => b.sessionType).filter(Boolean))].sort()
  const resourceOptions = [...new Set(bookings.map(b => b.resourceName).filter((n): n is string => Boolean(n)))].sort()
  const statusKeys      = [...new Set(bookings.map(b => b.status))].sort()
  const statusOptions   = statusKeys.map(s => STATUS_LABELS[s] ?? s)
  const statusKeyMap    = Object.fromEntries(Object.entries(STATUS_LABELS).map(([k, v]) => [v, k]))

  const hasFilters = serviceOptions.length > 0 || resourceOptions.length > 0 || statusOptions.length > 1

  const filtered = bookings.filter(b =>
    (!filterService  || b.sessionType  === filterService) &&
    (!filterResource || b.resourceName === filterResource) &&
    (!filterStatus   || b.status === (statusKeyMap[filterStatus] ?? filterStatus))
  )

  const activeCount = (filterService ? 1 : 0) + (filterResource ? 1 : 0) + (filterStatus ? 1 : 0)

  function clearAll() {
    setFilterService('')
    setFilterResource('')
    setFilterStatus('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
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

        <div className="ml-auto flex border border-border">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${view === 'list' ? 'bg-ink text-white' : 'bg-white text-secondary hover:text-ink'}`}
          >List</button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-l border-border ${view === 'calendar' ? 'bg-ink text-white' : 'bg-white text-secondary hover:text-ink'}`}
          >Calendar</button>
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
          <ChipRow label="Resource" options={resourceOptions} value={filterResource} onChange={setFilterResource} />
          <ChipRow label="Status"   options={statusOptions}   value={filterStatus}   onChange={setFilterStatus} />
        </div>
      )}

      {view === 'list'
        ? <BookingTable bookings={filtered} onSelect={setSelected} />
        : <CalendarView bookings={filtered} onSelect={setSelected} />
      }

      <BookingDrawer booking={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
