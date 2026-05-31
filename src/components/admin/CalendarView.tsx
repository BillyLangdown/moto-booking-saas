'use client'

import { useState } from 'react'
import type { Booking } from '@/types'
import Badge from '@/components/ui/Badge'

interface Props {
  bookings: Booking[]
  onSelect: (booking: Booking) => void
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function pad(n: number) { return String(n).padStart(2, '0') }
function toIso(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}` }
function monthLabel(y: number, m: number) {
  return new Date(y, m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}
function dayLabel(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}
function formatTime(t: string) { return t }

export default function CalendarView({ bookings, onSelect }: Props) {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState<string | null>(null)

  const todayIso = toIso(now.getFullYear(), now.getMonth(), now.getDate())

  const byDate: Record<string, Booking[]> = {}
  for (const b of bookings) {
    const d = b.slot?.date
    if (!d) continue
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(b)
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7

  const cells: (string | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toIso(year, month, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
    setSelected(null)
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
    setSelected(null)
  }

  const selectedBookings = selected ? (byDate[selected] ?? []) : []

  return (
    <div className="flex flex-col gap-5">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prev} className="flex h-9 w-9 items-center justify-center text-secondary hover:text-ink transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="text-sm font-semibold text-ink">{monthLabel(year, month)}</span>
        <button onClick={next} className="flex h-9 w-9 items-center justify-center text-secondary hover:text-ink transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Grid */}
      <div className="bg-white shadow-sm p-4">
        <div className="grid grid-cols-7 mb-2">
          {DAY_LABELS.map((d, i) => (
            <div key={i} className="flex items-center justify-center py-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{d}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((iso, i) => {
            if (!iso) return <div key={i} />
            const count = byDate[iso]?.length ?? 0
            const isToday = iso === todayIso
            const isSelected = iso === selected
            const hasData = count > 0

            return (
              <div key={iso} className="flex items-center justify-center p-1">
                <button
                  onClick={() => hasData ? setSelected(isSelected ? null : iso) : undefined}
                  disabled={!hasData}
                  className={[
                    'relative flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium transition-all',
                    isSelected
                      ? 'bg-ink text-white scale-105 shadow-sm'
                      : hasData
                      ? 'bg-ink/10 text-ink font-semibold hover:bg-ink/20 active:scale-95'
                      : 'text-secondary/50 cursor-default',
                  ].join(' ')}
                >
                  {parseInt(iso.slice(-2))}
                  {isToday && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-ink/60" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day bookings */}
      {selected && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-ink">{dayLabel(selected)}</p>
          {selectedBookings.length === 0 ? (
            <p className="text-sm text-secondary">No bookings on this date.</p>
          ) : (
            selectedBookings.map(b => (
              <div
                key={b.id}
                onClick={() => onSelect(b)}
                className="bg-white shadow-sm px-4 py-3 cursor-pointer hover:bg-subtle/60 transition-colors flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink">{b.name}</p>
                  {b.slot?.startTime && (
                    <p className="text-xs text-secondary mt-0.5">{formatTime(b.slot.startTime)} – {formatTime(b.slot.endTime)}{b.resourceName ? ` · ${b.resourceName}` : ''}</p>
                  )}
                </div>
                <Badge variant="licence" value={b.licenceType} />
                <Badge variant="status" value={b.status} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
