'use client'

import { useState } from 'react'
import type { AvailabilitySlot } from '@/types'
import SlotCard from './SlotCard'

interface Props {
  slots: AvailabilitySlot[]
  onSelect: (slot: AvailabilitySlot) => void
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function pad(n: number) { return String(n).padStart(2, '0') }

function isoDate(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`
}

function formatMonthHeading(y: number, m: number) {
  return new Date(y, m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function formatDayHeading(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

export default function BookingCalendar({ slots, onSelect }: Props) {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(null)

  const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate())
  const availableDates = new Set(slots.map((s) => s.date))

  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth     = new Date(year, month + 1, 0).getDate()
  const startOffset     = (firstDayOfMonth.getDay() + 6) % 7 // Monday = 0

  const cells: (string | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => isoDate(year, month, i + 1)),
  ]
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelected(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  const selectedSlots = selected ? slots.filter((s) => s.date === selected) : []

  return (
    <div className="flex flex-col gap-5">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-white/80 transition-colors text-secondary hover:text-ink"
          aria-label="Previous month"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="text-sm font-semibold text-ink">{formatMonthHeading(year, month)}</span>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-white/80 transition-colors text-secondary hover:text-ink"
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 text-center">
        {DAYS.map((d) => (
          <div key={d} className="text-[11px] font-semibold uppercase tracking-wide text-secondary py-1">
            {d.charAt(0)}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={i} />
          const isPast      = dateStr < todayIso
          const isToday     = dateStr === todayIso
          const hasSlots    = availableDates.has(dateStr)
          const isSelected  = dateStr === selected
          const isSelectable = hasSlots && !isPast

          return (
            <div key={dateStr} className="flex flex-col items-center gap-0.5 py-1">
              <button
                onClick={() => isSelectable ? setSelected(isSelected ? null : dateStr) : undefined}
                disabled={!isSelectable}
                className={[
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all',
                  isSelected
                    ? 'bg-accent text-white shadow-sm'
                    : isToday
                    ? 'border-2 border-accent text-accent'
                    : isSelectable
                    ? 'text-ink hover:bg-accent/10'
                    : isPast
                    ? 'text-muted'
                    : 'text-secondary',
                ].join(' ')}
              >
                {parseInt(dateStr.slice(-2))}
              </button>
              {/* Availability dot */}
              <div className={[
                'h-1.5 w-1.5 rounded-full transition-all',
                hasSlots && !isPast
                  ? isSelected ? 'bg-white opacity-0' : 'bg-accent'
                  : 'opacity-0',
              ].join(' ')} />
            </div>
          )
        })}
      </div>

      {/* Slots for selected date */}
      {selected && (
        <div className="flex flex-col gap-3 pt-2 border-t border-border">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-secondary">
            {formatDayHeading(selected)}
          </h3>
          {selectedSlots.length === 0 ? (
            <p className="text-sm text-secondary py-4 text-center">No available slots on this date.</p>
          ) : (
            selectedSlots.map((slot) => (
              <SlotCard key={slot.id} slot={slot} onSelect={onSelect} />
            ))
          )}
        </div>
      )}

      {!selected && availableDates.size === 0 && (
        <p className="text-sm text-secondary text-center py-4">No slots available this month.</p>
      )}
    </div>
  )
}
