'use client'

import { useState } from 'react'
import type { AvailabilitySlot } from '@/types'

interface Props { slots: AvailabilitySlot[] }

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function pad(n: number) { return String(n).padStart(2, '0') }
function toIso(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}` }
function monthLabel(y: number, m: number) {
  return new Date(y, m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}
function dayLabel(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function AvailabilityCalendarView({ slots }: Props) {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState<string | null>(null)

  const todayIso = toIso(now.getFullYear(), now.getMonth(), now.getDate())

  const byDate: Record<string, AvailabilitySlot[]> = {}
  for (const s of slots) {
    if (!byDate[s.date]) byDate[s.date] = []
    byDate[s.date].push(s)
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

  const selectedSlots = selected ? (byDate[selected] ?? []) : []

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <button onClick={prev} className="flex h-9 w-9 items-center justify-center text-secondary hover:text-ink transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="text-sm font-semibold text-ink">{monthLabel(year, month)}</span>
        <button onClick={next} className="flex h-9 w-9 items-center justify-center text-secondary hover:text-ink transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

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
            const daySlots = byDate[iso] ?? []
            const count = daySlots.length
            const isPast = iso < todayIso
            const isToday = iso === todayIso
            const isSelected = iso === selected
            const hasData = count > 0
            const totalBooked = daySlots.reduce((s, sl) => s + sl.booked, 0)
            const totalCap    = daySlots.reduce((s, sl) => s + sl.capacity, 0)
            const full = totalCap > 0 && totalBooked >= totalCap

            return (
              <div key={iso} className="flex items-center justify-center p-1">
                <button
                  onClick={() => hasData ? setSelected(isSelected ? null : iso) : undefined}
                  disabled={!hasData}
                  className={[
                    'relative flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium transition-all',
                    isSelected
                      ? 'bg-ink text-white scale-105 shadow-sm'
                      : full && !isPast
                      ? 'bg-rose-100 text-rose-700 font-semibold hover:bg-rose-200 active:scale-95'
                      : hasData && !isPast
                      ? 'bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200 active:scale-95'
                      : hasData && isPast
                      ? 'bg-ink/5 text-secondary/70 font-semibold'
                      : 'text-secondary/50 cursor-default',
                  ].join(' ')}
                >
                  {parseInt(iso.slice(-2))}
                  {isToday && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-ink/50" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-4 pt-3 border-t border-border/50 text-xs text-secondary">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 bg-emerald-100" />Available</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 bg-rose-100" />Full</span>
        </div>
      </div>

      {selected && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-ink">{dayLabel(selected)}</p>
          {selectedSlots.map(s => {
            const pct = s.capacity > 0 ? s.booked / s.capacity : 0
            const bar = pct >= 1 ? 'bg-rose-400' : pct >= 0.5 ? 'bg-amber-400' : 'bg-emerald-400'
            return (
              <div key={s.id} className="bg-white shadow-sm px-4 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink">{s.resource?.name ?? 'Unassigned'}</p>
                  <p className="text-xs text-secondary mt-0.5">{s.startTime} – {s.endTime} · {s.sessionType}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-16 h-1.5 bg-border overflow-hidden">
                    <div className={`h-full ${bar}`} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-secondary tabular-nums">{s.booked}/{s.capacity}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
