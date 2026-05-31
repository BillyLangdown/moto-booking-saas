'use client'

import { useState } from 'react'
import type { AvailabilitySlot, Booking, Tenant } from '@/types'
import SlotView from '@/components/booking/SlotView'
import BookingForm from '@/components/booking/BookingForm'
import BookingSuccess from '@/components/booking/BookingSuccess'

type View = 'slots' | 'form' | 'success'

interface Props {
  tenant: Tenant
  slots: AvailabilitySlot[]
}

export default function BookingPageClient({ tenant, slots }: Props) {
  const [view, setView]                       = useState<View>('slots')
  const [selectedSlot, setSelectedSlot]       = useState<AvailabilitySlot | null>(null)
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)

  function handleSelectSlot(slot: AvailabilitySlot) {
    setSelectedSlot(slot)
    setView('form')
  }

  function handleSuccess(booking: Booking) {
    setConfirmedBooking(booking)
    setView('success')
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header style={{ background: 'linear-gradient(180deg, #0D1117 0%, #1a2644 100%)' }}>
        <div className="mx-auto max-w-2xl px-4 py-5 flex items-center gap-4">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.name} className="h-10 w-auto max-w-[120px] object-contain" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center bg-white/10 text-white font-bold text-lg shrink-0">
              {tenant.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-bold text-white text-base leading-tight">{tenant.name}</p>
            {tenant.address && <p className="text-sm text-white/50 mt-0.5">{tenant.address}</p>}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-2xl px-4 py-8 flex-1">
        {view === 'slots' && (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-ink">Available sessions</h1>
              {tenant.description && (
                <p className="text-sm text-secondary mt-1 leading-relaxed">{tenant.description}</p>
              )}
            </div>
            <SlotView slots={slots} onSelect={handleSelectSlot} />
          </>
        )}

        {view === 'form' && selectedSlot && (
          <BookingForm
            slot={selectedSlot}
            tenantId={tenant.id}
            intakeQuestions={tenant.intakeQuestions ?? []}
            onBack={() => setView('slots')}
            onSuccess={handleSuccess}
          />
        )}

        {view === 'success' && confirmedBooking && (
          <BookingSuccess
            booking={confirmedBooking}
            onBookAnother={() => { setSelectedSlot(null); setConfirmedBooking(null); setView('slots') }}
          />
        )}
      </main>
    </div>
  )
}
