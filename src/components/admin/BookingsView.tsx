'use client'

import { useState } from 'react'
import type { Booking } from '@/types'
import BookingDrawer from './BookingDrawer'

// ─── Utilities ───────────────────────────────────────────────────────────────

function isoToday(): string {
  return new Date().toISOString().split('T')[0]
}

function currentHHMM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDayHeader(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function formatDateLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`)
  const today = new Date()
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 17) return 'Good afternoon.'
  return 'Good evening.'
}

function timeToMins(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function minutesUntil(time: string): number {
  const now = new Date()
  return timeToMins(time) - (now.getHours() * 60 + now.getMinutes())
}

function formatCountdown(mins: number): string {
  if (mins <= 0) return 'Now'
  if (mins < 60) return `in ${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `in ${h} hr ${m} min` : `in ${h} hr`
}

function formatGap(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`
}

// ─── Segment types ────────────────────────────────────────────────────────────

type BookingSegment = { type: 'booking'; booking: Booking }
type GapSegment     = { type: 'gap'; fromTime: string; toTime: string; minutes: number }
type Segment        = BookingSegment | GapSegment

function buildDaySegments(bookings: Booking[]): Segment[] {
  const sorted = [...bookings].sort(
    (a, b) => ((a.slot?.startTime ?? '') < (b.slot?.startTime ?? '') ? -1 : 1)
  )
  const segments: Segment[] = []

  for (let i = 0; i < sorted.length; i++) {
    segments.push({ type: 'booking', booking: sorted[i] })

    if (i < sorted.length - 1) {
      const thisEnd   = sorted[i].slot?.endTime ?? ''
      const nextStart = sorted[i + 1].slot?.startTime ?? ''
      if (thisEnd && nextStart) {
        const gapMins = timeToMins(nextStart) - timeToMins(thisEnd)
        if (gapMins >= 15) {
          segments.push({ type: 'gap', fromTime: thisEnd, toTime: nextStart, minutes: gapMins })
        }
      }
    }
  }
  return segments
}

// ─── Status dot ──────────────────────────────────────────────────────────────

function StatusDot({ status, isPast }: { status: Booking['status']; isPast: boolean }) {
  if (isPast)
    return <div className="w-[7px] h-[7px] rounded-full bg-border" />
  if (status === 'pending')
    return <div className="w-[8px] h-[8px] rounded-full border-[1.5px] border-secondary bg-surface" />
  return <div className="w-[8px] h-[8px] rounded-full bg-accent" />
}

// ─── Spine booking card ───────────────────────────────────────────────────────

function SpineCard({
  booking,
  isNext,
  isPast,
  onClick,
}: {
  booking: Booking
  isNext: boolean
  isPast: boolean
  onClick: () => void
}) {
  const isPending = booking.status === 'pending'

  return (
    <div className="flex items-start gap-0">
      {/* Left column — dot indicator, sits over the spine line */}
      <div className="shrink-0 w-4 flex justify-center pt-[14px] relative z-10">
        <StatusDot status={booking.status} isPast={isPast} />
      </div>

      {/* Card */}
      <button
        onClick={onClick}
        className={[
          'flex-1 text-left rounded-[10px] px-3.5 py-3 transition-all',
          isNext
            ? 'bg-card border border-accent/25 shadow-sm'
            : isPast
              ? 'bg-transparent border border-transparent hover:bg-card/60 hover:border-border/40'
              : 'bg-card border border-border/70 hover:border-border',
        ].join(' ')}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className={`text-xs font-mono tabular-nums shrink-0 ${isPast ? 'text-muted' : 'text-secondary'}`}>
            {booking.slot?.startTime}
          </span>
          <span className={`text-sm font-semibold flex-1 truncate ${isPast ? 'text-muted' : 'text-ink'}`}>
            {booking.name}
          </span>
          {isNext && (
            <span className="text-[10px] font-medium text-accent shrink-0">Next</span>
          )}
          {isPending && !isNext && (
            <span className="text-[10px] font-mono text-secondary/70 shrink-0">◌</span>
          )}
        </div>

        {(booking.sessionType || booking.resourceName) && (
          <p className={`text-xs mt-0.5 ${isPast ? 'text-muted/60' : 'text-muted'}`}>
            {[booking.sessionType, booking.resourceName].filter(Boolean).join(' · ')}
          </p>
        )}
      </button>
    </div>
  )
}

// ─── Spine gap block ──────────────────────────────────────────────────────────

function SpineGap({ segment }: { segment: GapSegment }) {
  return (
    <div className="flex items-center gap-0 py-1.5">
      {/* Left column — short horizontal dash at spine center */}
      <div className="shrink-0 w-4 flex justify-center">
        <div className="w-[9px] h-px bg-border" />
      </div>
      <p className="text-[11px] text-muted/55 tracking-wide pl-0.5">
        {formatGap(segment.minutes)} free
      </p>
    </div>
  )
}

// ─── Next appointment (primary card) ─────────────────────────────────────────

function NextCard({ booking, onClick }: { booking: Booking; onClick: () => void }) {
  const mins = booking.slot ? minutesUntil(booking.slot.startTime) : null

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-[14px] overflow-hidden flex group"
      style={{ background: '#1F2937' }}
    >
      {/* Left accent rail */}
      <div className="w-[5px] shrink-0 bg-accent" />

      {/* Content */}
      <div className="flex-1 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-medium text-white/40 tracking-wide">
            ▸ Next appointment
          </p>
          {mins !== null && (
            <span className="text-[11px] text-white/30 shrink-0 tabular-nums">
              {formatCountdown(mins)}
            </span>
          )}
        </div>

        <div className="mt-3.5">
          <p className="text-[22px] font-semibold text-white leading-tight tracking-[-0.01em]">
            {booking.name}
          </p>
          <p className="text-sm text-white/45 mt-1">
            {[
              booking.sessionType,
              booking.slot ? `${booking.slot.startTime} – ${booking.slot.endTime}` : null,
              booking.resourceName,
            ].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-white/25 font-medium group-hover:text-white/40 transition-colors">
          View details
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
            <path d="M1.5 4.5h6M4.5 1.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingsView({ bookings }: { bookings: Booking[] }) {
  const [selected, setSelected] = useState<Booking | null>(null)

  const today = isoToday()
  const now   = currentHHMM()

  const todayBookings = bookings
    .filter(b => b.slot?.date === today && b.status !== 'cancelled')
    .sort((a, b) => ((a.slot?.startTime ?? '') < (b.slot?.startTime ?? '') ? -1 : 1))

  const nextBooking = todayBookings.find(b => b.slot && b.slot.startTime >= now)

  const upcomingBookings = bookings
    .filter(b => b.slot?.date && b.slot.date > today && b.status !== 'cancelled')
    .sort((a, b) => {
      const da = `${a.slot?.date ?? ''}${a.slot?.startTime ?? ''}`
      const db = `${b.slot?.date ?? ''}${b.slot?.startTime ?? ''}`
      return da < db ? -1 : 1
    })

  const grouped = upcomingBookings.reduce<Record<string, Booking[]>>((acc, b) => {
    const key = b.slot!.date
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {})

  const daySegments = buildDaySegments(todayBookings)

  return (
    <>
      <div className="flex flex-col gap-8 max-w-xl">

        {/* Date header */}
        <div className="flex flex-col gap-0.5">
          <p className="text-sm text-secondary">{getGreeting()}</p>
          <h1 className="text-2xl font-semibold text-ink leading-tight tracking-[-0.01em]">
            {formatDayHeader(today)}
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {todayBookings.length === 0
              ? 'Nothing in the books today.'
              : `${todayBookings.length} appointment${todayBookings.length !== 1 ? 's' : ''} today`}
          </p>
        </div>

        {/* Next appointment — primary card */}
        {nextBooking && (
          <NextCard booking={nextBooking} onClick={() => setSelected(nextBooking)} />
        )}

        {/* Today — Day Spine */}
        {todayBookings.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-medium text-muted tracking-wide">Today's plan</p>

            {/* Spine container */}
            <div className="relative">
              {/* The Day Spine — vertical line running through the left dot column */}
              <div
                className="absolute bg-border/50"
                style={{ left: '7px', top: '14px', bottom: '14px', width: '1px' }}
              />

              <div className="flex flex-col gap-1">
                {daySegments.map((seg, i) =>
                  seg.type === 'booking' ? (
                    <SpineCard
                      key={seg.booking.id}
                      booking={seg.booking}
                      isNext={seg.booking.id === nextBooking?.id}
                      isPast={!!seg.booking.slot && seg.booking.slot.startTime < now}
                      onClick={() => setSelected(seg.booking)}
                    />
                  ) : (
                    <SpineGap key={`gap-${i}`} segment={seg} />
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty today */}
        {todayBookings.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-secondary">Nothing scheduled today.</p>
            <p className="text-xs text-muted mt-1">Enjoy the space.</p>
          </div>
        )}

        {/* Upcoming */}
        {Object.keys(grouped).length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-medium text-muted tracking-wide">Upcoming</p>

            <div className="flex flex-col gap-3">
              {Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, dateBookings]) => (
                  <div key={date}>
                    <p className="text-xs font-medium text-secondary mb-2">
                      {formatDateLabel(date)}
                    </p>
                    <div className="bg-card border border-border rounded-[10px] overflow-hidden divide-y divide-border/50">
                      {dateBookings.map(b => (
                        <button
                          key={b.id}
                          onClick={() => setSelected(b)}
                          className="w-full text-left flex items-center gap-4 pl-4 pr-4 py-3.5 hover:bg-subtle/60 transition-colors"
                        >
                          <span className="text-xs font-mono tabular-nums text-muted w-10 shrink-0">
                            {b.slot?.startTime ?? '—'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{b.name}</p>
                            {b.sessionType && (
                              <p className="text-xs text-muted mt-0.5 truncate">{b.sessionType}</p>
                            )}
                          </div>
                          {b.status === 'pending' && (
                            <span className="text-[10px] font-mono text-muted shrink-0">◌</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* No bookings at all */}
        {bookings.length === 0 && (
          <div className="py-14 text-center">
            <p className="text-sm font-medium text-ink">No bookings yet.</p>
            <p className="text-xs text-secondary mt-1">Share your booking page to get started.</p>
          </div>
        )}

      </div>

      <BookingDrawer booking={selected} onClose={() => setSelected(null)} />
    </>
  )
}
