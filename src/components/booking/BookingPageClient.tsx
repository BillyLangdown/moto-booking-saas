'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AvailabilitySlot, Booking, Tenant } from '@/types'
import BookingForm from '@/components/booking/BookingForm'
import BookingSuccess from '@/components/booking/BookingSuccess'

type Step = 'service' | 'date' | 'time' | 'details' | 'success'

interface Props {
  tenant: Tenant
  slots: AvailabilitySlot[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateCard(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00`)
  const today    = new Date()
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1)
  return {
    weekday:    d.toLocaleDateString('en-GB', { weekday: 'short' }),
    day:        String(d.getDate()),
    month:      d.toLocaleDateString('en-GB', { month: 'short' }),
    isToday:    d.toDateString() === today.toDateString(),
    isTomorrow: d.toDateString() === tomorrow.toDateString(),
  }
}

function formatSlotDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

const CURRENCY_SYMBOL: Record<string, string> = { gbp: '£', usd: '$', eur: '€' }

function usePriceDisplay(tenant: Tenant) {
  const symbol = CURRENCY_SYMBOL[tenant.currency] ?? '£'
  const show   = tenant.showPricesOnBookingPage && tenant.paymentMode !== 'none'

  function priceFor(sessionType: string | null): { label: string; sub?: string } | null {
    if (!show || !sessionType) return null
    const p = tenant.sessionTypePrices?.[sessionType]
    if (!p) return null
    if (tenant.paymentMode === 'deposit') {
      const deposit = p.depositAmount ? `${symbol}${(p.depositAmount / 100).toFixed(0)}` : null
      const full    = p.price         ? `${symbol}${(p.price / 100).toFixed(0)}` : null
      if (!deposit && !full) return null
      return {
        label: deposit ? `${deposit} deposit` : full!,
        sub:   deposit && full ? `${full} total` : undefined,
      }
    }
    const price = p.price ? `${symbol}${(p.price / 100).toFixed(0)}` : null
    return price ? { label: price } : null
  }

  return { priceFor, show }
}

// ─── Back button ──────────────────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-secondary hover:text-ink transition-colors w-fit"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  )
}

// ─── Time row (replaces grid button) ─────────────────────────────────────────

function TimeRow({
  slot,
  onSelect,
}: {
  slot: AvailabilitySlot
  onSelect: (s: AvailabilitySlot) => void
}) {
  const almostFull = (slot.capacity - slot.booked) === 1

  return (
    <button
      onClick={() => onSelect(slot)}
      className="group w-full flex items-center justify-between py-4 border-b border-border/50 last:border-0 hover:bg-subtle/40 transition-colors px-1"
    >
      <span className="text-[17px] font-semibold tabular-nums text-ink tracking-[-0.01em]">
        {slot.startTime}
      </span>
      <div className="flex items-center gap-3 shrink-0">
        {almostFull && (
          <span className="text-[11px] text-muted font-medium">Last space</span>
        )}
        <span className="text-muted group-hover:text-accent transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingPageClient({ tenant, slots }: Props) {
  const router = useRouter()

  const services          = [...new Set(slots.map(s => s.sessionType).filter(Boolean))].sort() as string[]
  const hasMultipleServices = services.length > 1
  const firstStep: Step   = hasMultipleServices ? 'service' : 'date'

  const [step, setStep]                   = useState<Step>(firstStep)
  const [selectedService, setSelectedService] = useState<string | null>(
    hasMultipleServices ? null : (services[0] ?? null)
  )
  const [selectedDate, setSelectedDate]   = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot]   = useState<AvailabilitySlot | null>(null)
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)

  const { priceFor } = usePriceDisplay(tenant)

  const slotsForService = selectedService
    ? slots.filter(s => !s.sessionType || s.sessionType === selectedService)
    : slots

  const availableDates = [...new Set(
    slotsForService.filter(s => s.capacity > s.booked).map(s => s.date)
  )].sort()

  const slotsForDate = (selectedDate
    ? slotsForService.filter(s => s.date === selectedDate && s.capacity > s.booked)
    : []
  ).sort((a, b) => a.startTime < b.startTime ? -1 : 1)

  const morningSlots   = slotsForDate.filter(s => parseInt(s.startTime.split(':')[0]) < 12)
  const afternoonSlots = slotsForDate.filter(s => parseInt(s.startTime.split(':')[0]) >= 12)

  const visibleSteps: Step[] = hasMultipleServices
    ? ['service', 'date', 'time', 'details']
    : ['date', 'time', 'details']
  const progressPct = step === 'success' ? 100
    : ((visibleSteps.indexOf(step) + 1) / visibleSteps.length) * 100

  function goBack() {
    if (step === 'date' && hasMultipleServices) { setStep('service'); return }
    if (step === 'date') return
    if (step === 'time')    { setStep('date'); return }
    if (step === 'details') { setStep('time'); return }
  }

  function canGoBack() {
    if (step === 'service') return false
    if (step === 'date' && !hasMultipleServices) return false
    if (step === 'success') return false
    return true
  }

  function selectTime(slot: AvailabilitySlot) {
    setSelectedSlot(slot)
    setStep('details')
  }

  return (
    <div className="min-h-dvh flex flex-col bg-surface">

      {/* ── Header ── */}
      <header style={{ background: '#1F2937' }}>
        <div className="mx-auto max-w-lg px-5 pt-5 pb-4 flex items-center gap-4">
          {tenant.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-9 w-auto max-w-[120px] object-contain shrink-0"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white font-semibold shrink-0 text-sm">
              {tenant.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm leading-tight truncate">{tenant.name}</p>
            {tenant.address && (
              <p className="text-xs text-white/35 mt-0.5 truncate">{tenant.address}</p>
            )}
          </div>
        </div>

        {/* Step label */}
        {step !== 'success' && (
          <div className="mx-auto max-w-lg px-5 pb-3">
            <p className="text-[11px] text-white/30 tracking-wide">
              {step === 'service' ? 'Choose a service'
                : step === 'date' ? 'Choose a date'
                : step === 'time' ? 'Choose a time'
                : 'Your details'}
            </p>
          </div>
        )}

        {/* Progress bar */}
        {step !== 'success' && (
          <div className="h-[2px] bg-white/8">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main className="flex-1 mx-auto w-full max-w-lg px-5 py-10">

        {/* ── STEP: Service ── */}
        {step === 'service' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold text-ink">What would you like to book?</h1>
              {tenant.description && (
                <p className="text-sm text-secondary leading-relaxed">{tenant.description}</p>
              )}
            </div>

            {/* Service cards — menu style with accent strip */}
            <div className="flex flex-col gap-2.5">
              {services.map(service => {
                const price = priceFor(service)
                return (
                  <button
                    key={service}
                    onClick={() => { setSelectedService(service); setStep('date') }}
                    className="group w-full text-left bg-card rounded-xl overflow-hidden flex hover:shadow-sm transition-all"
                  >
                    {/* Accent strip — animates on hover */}
                    <div className="w-[4px] shrink-0 bg-accent/20 group-hover:bg-accent transition-colors duration-200" />

                    <div className="flex-1 flex items-center justify-between gap-4 px-5 py-5">
                      <span className="text-[15px] font-semibold text-ink leading-snug">{service}</span>
                      {price ? (
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-ink">{price.label}</p>
                          {price.sub && <p className="text-xs text-muted">{price.sub}</p>}
                        </div>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-muted group-hover:text-accent transition-colors shrink-0">
                          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── STEP: Date ── */}
        {step === 'date' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              {canGoBack() && <BackButton onClick={goBack} />}
              <div>
                <h1 className="text-2xl font-semibold text-ink">Choose a date</h1>
                {selectedService && (
                  <p className="text-sm text-secondary mt-1">{selectedService}</p>
                )}
              </div>
            </div>

            {availableDates.length === 0 ? (
              <div className="bg-card border border-border rounded-xl py-16 text-center">
                <p className="text-sm text-secondary">No available dates right now.</p>
                <p className="text-xs text-muted mt-1">Check back soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {availableDates.map(date => {
                  const { weekday, day, month, isToday, isTomorrow } = formatDateCard(date)
                  return (
                    <button
                      key={date}
                      onClick={() => { setSelectedDate(date); setStep('time') }}
                      className="group flex flex-col items-center gap-1 bg-card border border-border rounded-xl px-2 py-5 hover:border-accent/50 hover:shadow-sm transition-all"
                    >
                      <span className="text-[10px] font-medium text-muted group-hover:text-accent transition-colors uppercase tracking-wider">
                        {isToday ? 'Today' : isTomorrow ? 'Tmrw' : weekday}
                      </span>
                      <span className="text-[28px] font-bold text-ink leading-none tabular-nums">{day}</span>
                      <span className="text-[10px] text-muted uppercase tracking-wider">{month}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STEP: Time ── */}
        {step === 'time' && selectedDate && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <BackButton onClick={goBack} />
              <div>
                <h1 className="text-2xl font-semibold text-ink">Pick a time</h1>
                <p className="text-sm text-secondary mt-1">{formatSlotDate(selectedDate)}</p>
              </div>
            </div>

            {slotsForDate.length === 0 ? (
              <div className="bg-card border border-border rounded-xl py-16 text-center">
                <p className="text-sm text-secondary">No times available for this day.</p>
                <button
                  onClick={() => setStep('date')}
                  className="text-xs text-accent mt-3 underline underline-offset-2"
                >
                  Choose a different day
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-7">
                {morningSlots.length > 0 && (
                  <div>
                    {/* Period label with decorative rule */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[11px] font-medium text-muted uppercase tracking-widest shrink-0">Morning</span>
                      <div className="flex-1 h-px bg-border/60" />
                    </div>
                    <div className="flex flex-col">
                      {morningSlots.map(slot => (
                        <TimeRow key={slot.id} slot={slot} onSelect={selectTime} />
                      ))}
                    </div>
                  </div>
                )}

                {afternoonSlots.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[11px] font-medium text-muted uppercase tracking-widest shrink-0">Afternoon</span>
                      <div className="flex-1 h-px bg-border/60" />
                    </div>
                    <div className="flex flex-col">
                      {afternoonSlots.map(slot => (
                        <TimeRow key={slot.id} slot={slot} onSelect={selectTime} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STEP: Details ── */}
        {step === 'details' && selectedSlot && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <BackButton onClick={goBack} />

              {/* Booking summary — ticket stub style */}
              {(() => {
                const price = priceFor(selectedSlot.sessionType)
                return (
                  <div className="flex overflow-hidden rounded-xl">
                    {/* Left accent rail */}
                    <div className="w-[4px] shrink-0 bg-accent" />

                    <div className="flex-1 bg-accent/6 border border-accent/15 border-l-0 px-4 py-3.5 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-accent leading-none">
                          {formatSlotDate(selectedSlot.date)}
                        </p>
                        <p className="text-xs text-accent/65 mt-1.5">
                          {selectedSlot.startTime} – {selectedSlot.endTime}
                          {selectedSlot.sessionType && ` · ${selectedSlot.sessionType}`}
                          {selectedSlot.resource?.name && ` · ${selectedSlot.resource.name}`}
                        </p>
                      </div>
                      {price && (
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-accent">{price.label}</p>
                          {price.sub && <p className="text-[10px] text-accent/50 mt-0.5">{price.sub}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              <h1 className="text-2xl font-semibold text-ink">Your details</h1>
            </div>

            <BookingForm
              slot={selectedSlot}
              tenantId={tenant.id}
              intakeQuestions={tenant.intakeQuestions ?? []}
              onBack={() => setStep('time')}
              onSuccess={(booking) => { setConfirmedBooking(booking); setStep('success') }}
              price={priceFor(selectedSlot.sessionType) ?? undefined}
              hideHeader
            />
          </div>
        )}

        {/* ── STEP: Success ── */}
        {step === 'success' && confirmedBooking && (
          <BookingSuccess
            booking={confirmedBooking}
            tenant={tenant}
            slot={selectedSlot ?? undefined}
            onBookAnother={() => {
              setSelectedService(hasMultipleServices ? null : (services[0] ?? null))
              setSelectedDate(null)
              setSelectedSlot(null)
              setConfirmedBooking(null)
              setStep(firstStep)
              router.refresh()
            }}
          />
        )}
      </main>
    </div>
  )
}
