'use client'

import { useState } from 'react'
import type { Booking } from '@/types'
import BookingTable from './BookingTable'
import CalendarView from './CalendarView'

interface Props {
  bookings: Booking[]
}

type View = 'list' | 'calendar'

export default function BookingsView({ bookings }: Props) {
  const [view, setView] = useState<View>('list')

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle */}
      <div className="flex items-center gap-1 self-end bg-subtle border border-border rounded-lg p-1">
        <button
          onClick={() => setView('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            view === 'list'
              ? 'bg-white text-ink shadow-sm'
              : 'text-secondary hover:text-ink'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5h10M2 7h10M2 10.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          List
        </button>
        <button
          onClick={() => setView('calendar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            view === 'calendar'
              ? 'bg-white text-ink shadow-sm'
              : 'text-secondary hover:text-ink'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M1.5 5.5h11M4.5 1.5v2M9.5 1.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Calendar
        </button>
      </div>

      {view === 'list' ? (
        <BookingTable bookings={bookings} />
      ) : (
        <CalendarView bookings={bookings} />
      )}
    </div>
  )
}
