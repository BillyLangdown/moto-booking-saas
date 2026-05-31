'use client'

import { useState } from 'react'
import type { Booking } from '@/types'
import BookingTable from './BookingTable'
import CalendarView from './CalendarView'
import BookingDrawer from './BookingDrawer'

interface Props { bookings: Booking[] }
type View = 'list' | 'calendar'

export default function BookingsView({ bookings }: Props) {
  const [view, setView]       = useState<View>('list')
  const [selected, setSelected] = useState<Booking | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex self-end border border-border">
        <button
          onClick={() => setView('list')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${view === 'list' ? 'bg-ink text-white' : 'bg-white text-secondary hover:text-ink'}`}
        >List</button>
        <button
          onClick={() => setView('calendar')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-l border-border ${view === 'calendar' ? 'bg-ink text-white' : 'bg-white text-secondary hover:text-ink'}`}
        >Calendar</button>
      </div>

      {view === 'list'
        ? <BookingTable bookings={bookings} onSelect={setSelected} />
        : <CalendarView bookings={bookings} onSelect={setSelected} />
      }

      <BookingDrawer booking={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
