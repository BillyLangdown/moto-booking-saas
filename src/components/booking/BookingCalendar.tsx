'use client'

import { useState } from 'react'
import type { AvailabilitySlot } from '@/types'
import SlotCard from './SlotCard'

interface Props {
  slots: AvailabilitySlot[]
  onSelect: (slot: AvailabilitySlot) => void
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function pad(n: number) { return String(n).padStart(2, '0') }

function toIso(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`
}

function monthLabel(y: number, m: number) {
  return new Date(y, m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function dayLabel(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

export default function BookingCalendar({ slots, onSelect }: Props) {
  const now = new Date()
  const [year, setYear]     = useState(now.getFullYear())
  const [month, setMonth]   = useState(now.getMonth())
  const [selected, setSelected] = useState<string | null>(null)

  const todayIso = toIso(now.getFullYear(), now.getMonth(), now.getDate())

  // Set of dates that have at least one available slot
  const availableDates = new Set(
    slots.filter((s) => s.date >= todayIso).map((s) => s.date),
  )

  // Build the calendar grid cells
  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const startOffset  = (new Date(year, month, 1).getDay() + 6) % 7  // Mon = 0

  const cells: (string | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toIso(year, month, i + 1)),
  ]
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

  const selectedSlots = selected
    ? slots.filter((s) => s.date === selected && s.date >= todayIso)
    : []

  return (
    <div className="flex flex-col gap-6">

      {/* Month navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={prevMonth}
          aria-label="Previous month"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-secondary hover:text-ink hover:bg-subtle transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-base font-semibold text-ink">{monthLabel(year, month)}</span>
        <button
          onClick={nextMonth}
          aria-label="Next month"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-secondary hover:text-ink hover:bg-subtle transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="flex items-center justify-center py-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-secondary">{d}</span>
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-y-1 -mt-3">
        {cells.map((iso, i) => {
          if (!iso) return <div key={i} />
          const isPast      = iso < todayIso
          const isToday     = iso === todayIso
          const canBook     = availableDates.has(iso)
          const isSelected  = iso === selected

          return (
            <div key={iso} className="flex items-center justify-center p-1">
              <button
                onClick={() => canBook ? setSelected(isSelected ? null : iso) : undefined}
                disabled={!canBook}
                aria-label={iso}
                aria-pressed={isSelected}
                className={[
                  'relative flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium transition-all',
                  isSelected
                    ? 'bg-accent text-white shadow-sm scale-105'
                    : canBook
                    ? 'bg-accent/15 text-accent font-semibold hover:bg-accent/30 active:scale-95'
                    : isPast
                    ? 'text-muted cursor-default'
                    : 'text-secondary/50 cursor-default',
                ].join(' ')}
              >
                {parseInt(iso.slice(-2))}
                {isToday && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent" />
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-secondary px-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-accent text-[10px] font-bold">1</span>
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold">1</span>
          Selected
        </span>
        <span className="flex items-center gap-1.5">
  <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]">
    <span className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent" />
  </span>

  <span>Today</span>
</span>
      </div>

      {/* Slots for selected date */}
      {selected && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-sm font-semibold text-ink">{dayLabel(selected)}</p>
          {selectedSlots.length === 0 ? (
            <p className="text-sm text-secondary py-2">No available slots for this date.</p>
          ) : (
            selectedSlots.map((slot) => (
              <SlotCard key={slot.id} slot={slot} onSelect={onSelect} />
            ))
          )}
        </div>
      )}

      {/* Empty state — no slots this month */}
      {availableDates.size === 0 && !selected && (
        <p className="text-sm text-secondary text-center py-2">
          No sessions available this month. Try the next month.
        </p>
      )}
    </div>
  )
}
