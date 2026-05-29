'use client'

import { useState } from 'react'
import type { AvailabilitySlot, Booking, Tenant } from '@/types'
import SlotList from '@/components/booking/SlotList'
import BookingForm from '@/components/booking/BookingForm'
import BookingSuccess from '@/components/booking/BookingSuccess'

type View = 'slots' | 'form' | 'success'

interface Props {
  tenant: Tenant
  slots: AvailabilitySlot[]
}

export default function BookingPageClient({ tenant, slots }: Props) {
  const [view, setView] = useState<View>('slots')
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)

  function handleSelectSlot(slot: AvailabilitySlot) {
    setSelectedSlot(slot)
    setView('form')
  }

  function handleSuccess(booking: Booking) {
    setConfirmedBooking(booking)
    setView('success')
  }

  function handleBookAnother() {
    setSelectedSlot(null)
    setConfirmedBooking(null)
    setView('slots')
  }

  return (
    <>
      {/* Tenant header */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-2xl px-4 py-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white font-bold text-lg shrink-0">
            {tenant.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-ink leading-tight">{tenant.name}</p>
            <p className="text-xs text-secondary">{tenant.address}</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        {view === 'slots' && (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-ink">Available sessions</h1>
              <p className="text-sm text-secondary mt-1">{tenant.description}</p>
            </div>
            <SlotList slots={slots} onSelect={handleSelectSlot} />
          </>
        )}

        {view === 'form' && selectedSlot && (
          <BookingForm
            slot={selectedSlot}
            tenantId={tenant.id}
            onBack={() => setView('slots')}
            onSuccess={handleSuccess}
          />
        )}

        {view === 'success' && confirmedBooking && (
          <BookingSuccess booking={confirmedBooking} onBookAnother={handleBookAnother} />
        )}
      </main>
    </>
  )
}
