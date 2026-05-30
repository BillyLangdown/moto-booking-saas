'use client'

import { useState } from 'react'
import type { Booking } from '@/types'

interface Props {
  bookings: Booking[]
  onSelect: (booking: Booking) => void
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 07:00–19:00
const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay()
  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() - ((day + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function fmt(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function CalendarView({ bookings, onSelect }: Props) {
  const [baseDate, setBaseDate] = useState(() => new Date())
  const weekDates = getWeekDates(baseDate)
  const todayStr  = isoDate(new Date())

  function prevWeek() {
    const d = new Date(baseDate)
    d.setDate(d.getDate() - 7)
    setBaseDate(d)
  }
  function nextWeek() {
    const d = new Date(baseDate)
    d.setDate(d.getDate() + 7)
    setBaseDate(d)
  }

  const byDay: Record<string, Booking[]> = {}
  for (const b of bookings) {
    const date = b.slot?.date
    if (!date) continue
    if (!byDay[date]) byDay[date] = []
    byDay[date].push(b)
  }

  function bookingTop(startTime: string) {
    const [h, m] = startTime.split(':').map(Number)
    return ((h - 7) + m / 60) * 56
  }

  function bookingHeight(startTime: string, endTime: string) {
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const mins = (eh * 60 + em) - (sh * 60 + sm)
    return Math.max((mins / 60) * 56, 28)
  }

  const gridHeight = HOURS.length * 56

  return (
    <div className="flex flex-col gap-3">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-subtle transition-colors text-secondary hover:text-ink">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="text-sm font-semibold text-ink">
          {fmt(weekDates[0])} – {fmt(weekDates[6])}
        </span>
        <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-subtle transition-colors text-secondary hover:text-ink">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <div className="min-w-[640px]">
          {/* Day headers */}
          <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-border">
            <div />
            {weekDates.map((d, i) => {
              const ds = isoDate(d)
              const isToday = ds === todayStr
              const count = (byDay[ds] ?? []).length
              return (
                <div key={i} className={`py-2.5 text-center border-l border-border ${isToday ? 'bg-accent/5' : ''}`}>
                  <p className="text-xs text-secondary">{DAYS[i]}</p>
                  <p className={`text-sm font-semibold mt-0.5 ${isToday ? 'text-accent' : 'text-ink'}`}>
                    {d.getDate()}
                  </p>
                  {count > 0 && (
                    <p className="text-[10px] text-secondary mt-0.5">{count}</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Time + event grid */}
          <div className="grid grid-cols-[52px_repeat(7,1fr)]" style={{ height: gridHeight }}>
            {/* Hour labels */}
            <div className="relative border-r border-border">
              {HOURS.map((h) => (
                <div key={h} className="absolute text-right pr-2" style={{ top: (h - 7) * 56 - 8, width: '100%' }}>
                  <span className="text-[10px] text-muted leading-none">{h}:00</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDates.map((d, i) => {
              const ds = isoDate(d)
              const dayBookings = byDay[ds] ?? []
              const isToday = ds === todayStr
              return (
                <div key={i} className={`relative border-l border-border ${isToday ? 'bg-accent/5' : ''}`}>
                  {/* Hour lines */}
                  {HOURS.map((h) => (
                    <div key={h} className="absolute w-full border-t border-border/40" style={{ top: (h - 7) * 56 }} />
                  ))}
                  {/* Bookings */}
                  {dayBookings.map((b) => {
                    if (!b.slot?.startTime || !b.slot?.endTime) return null
                    const top = bookingTop(b.slot.startTime)
                    const height = bookingHeight(b.slot.startTime, b.slot.endTime)
                    if (top < 0 || top > gridHeight) return null
                    return (
                      <button
                        key={b.id}
                        onClick={() => onSelect(b)}
                        className="absolute mx-0.5 rounded border bg-accent/10 border-accent/30 px-1.5 py-1 overflow-hidden text-left w-[calc(100%-4px)] hover:bg-accent/20 transition-colors"
                        style={{ top, height, left: 0, right: 0 }}
                      >
                        <p className="text-xs font-semibold text-ink leading-tight truncate">{b.name}</p>
                        <p className="text-xs text-secondary truncate">{b.slot.startTime}–{b.slot.endTime}</p>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
