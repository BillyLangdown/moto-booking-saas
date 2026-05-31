'use client'

import { useTransition, useEffect, useState } from 'react'
import type { Booking } from '@/types'
import Badge from '@/components/ui/Badge'
import { confirmBookingAction, cancelBookingAction } from '@/app/actions'

interface Props {
  booking: Booking | null
  onClose: () => void
}

function formatDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

function formatCreated(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{title}</p>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-secondary">{label}</span>
      <div className="text-sm font-medium text-ink">{children}</div>
    </div>
  )
}

export default function BookingDrawer({ booking, onClose }: Props) {
  const [confirming, startConfirm] = useTransition()
  const [cancelling, startCancel]  = useTransition()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const open = booking !== null

  useEffect(() => {
    if (!open) { setConfirmCancel(false); return }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const hasAnswers = booking?.intakeAnswers && Object.keys(booking.intakeAnswers).length > 0
  const isCancelled = booking?.status === 'cancelled'

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:w-[440px] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border">
          <div className="flex flex-col gap-2 min-w-0">
            <p className="text-lg font-bold text-ink leading-tight truncate">{booking?.name}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {booking && <Badge variant="status" value={booking.status} />}
              {booking && <Badge variant="licence" value={booking.licenceType} />}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="mt-1 shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:bg-subtle hover:text-ink transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {booking && (
            <>
              {/* Session */}
              <Section title="Session">
                {booking.slot?.date && (
                  <Field label="Date">{formatDate(booking.slot.date)}</Field>
                )}
                {booking.slot?.startTime && booking.slot?.endTime && (
                  <Field label="Time">{booking.slot.startTime} – {booking.slot.endTime}</Field>
                )}
                {booking.resourceName && (
                  <Field label="Instructor">{booking.resourceName}</Field>
                )}
              </Section>

              {/* Contact */}
              <Section title="Customer">
                <Field label="Name">{booking.name}</Field>
                <Field label="Email">
                  <a href={`mailto:${booking.email}`} className="text-accent hover:underline break-all font-medium">
                    {booking.email}
                  </a>
                </Field>
                {booking.phone && (
                  <Field label="Phone">
                    <a href={`tel:${booking.phone}`} className="text-accent hover:underline font-medium">
                      {booking.phone}
                    </a>
                  </Field>
                )}
              </Section>

              {/* Intake answers */}
              {hasAnswers && (
                <Section title="Booking questions">
                  {Object.entries(booking.intakeAnswers).map(([question, answer]) => (
                    <Field key={question} label={question}>{answer || '—'}</Field>
                  ))}
                </Section>
              )}

              {/* Notes */}
              {booking.notes && (
                <Section title="Notes">
                  <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{booking.notes}</p>
                </Section>
              )}

              {/* Booking info */}
              <Section title="Booking details">
                <Field label="Booked on">{formatCreated(booking.createdAt)}</Field>
                <Field label="Reference">
                  <span className="font-mono text-xs text-secondary">{booking.id}</span>
                </Field>
              </Section>
            </>
          )}
        </div>

        {/* Footer actions */}
        {booking && !isCancelled && (
          <div className="shrink-0 border-t border-border px-6 py-4 flex flex-col gap-3">
            {booking.status === 'pending' && (
              <button
                disabled={confirming}
                onClick={() => startConfirm(async () => { await confirmBookingAction(booking.id); onClose() })}
                className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {confirming ? 'Confirming…' : 'Confirm booking'}
              </button>
            )}

            {!confirmCancel ? (
              <button
                onClick={() => setConfirmCancel(true)}
                className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-secondary hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                Cancel booking
              </button>
            ) : (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex flex-col gap-2">
                <p className="text-sm font-medium text-rose-700 text-center">Cancel this booking?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="flex-1 rounded-lg border border-border bg-white py-2 text-sm font-medium text-secondary hover:text-ink transition-colors"
                  >
                    Keep it
                  </button>
                  <button
                    disabled={cancelling}
                    onClick={() => startCancel(async () => { await cancelBookingAction(booking.id); onClose() })}
                    className="flex-1 rounded-lg bg-rose-600 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
