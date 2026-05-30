'use client'

import { useTransition, useEffect } from 'react'
import type { Booking } from '@/types'
import Badge from '@/components/ui/Badge'
import { confirmBookingAction } from '@/app/actions'

interface Props {
  booking: Booking | null
  onClose: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatCreated(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-border last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-secondary">{label}</span>
      <div className="text-sm text-ink">{children}</div>
    </div>
  )
}

export default function BookingDrawer({ booking, onClose }: Props) {
  const [confirming, startConfirm] = useTransition()
  const open = booking !== null

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:w-[420px] ${open ? 'translate-x-0' : 'translate-x-full'}`}
        aria-modal="true"
        role="dialog"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex flex-col gap-1.5 min-w-0">
            <p className="text-base font-semibold text-ink leading-tight truncate">
              {booking?.name ?? ''}
            </p>
            <Badge variant="status" value={booking?.status ?? 'confirmed'} />
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:bg-subtle hover:text-ink transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {booking && (
            <div className="flex flex-col">

              {/* Customer */}
              <p className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Customer</p>
              <div className="rounded-xl border border-border bg-white divide-y divide-border mb-4">
                <Row label="Name">{booking.name}</Row>
                <Row label="Email">
                  <a href={`mailto:${booking.email}`} className="text-accent hover:underline break-all">
                    {booking.email}
                  </a>
                </Row>
                {booking.phone && (
                  <Row label="Phone">
                    <a href={`tel:${booking.phone}`} className="text-accent hover:underline">
                      {booking.phone}
                    </a>
                  </Row>
                )}
              </div>

              {/* Session */}
              <p className="pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Session</p>
              <div className="rounded-xl border border-border bg-white divide-y divide-border mb-4">
                <Row label="Type">
                  <Badge variant="licence" value={booking.licenceType} />
                </Row>
                {booking.slot?.date && (
                  <Row label="Date">{formatDate(booking.slot.date)}</Row>
                )}
                {booking.slot?.startTime && booking.slot?.endTime && (
                  <Row label="Time">{booking.slot.startTime} – {booking.slot.endTime}</Row>
                )}
              </div>

              {/* Booking info */}
              <p className="pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Booking</p>
              <div className="rounded-xl border border-border bg-white divide-y divide-border mb-4">
                <Row label="Reference">
                  <span className="font-mono text-xs break-all">{booking.id}</span>
                </Row>
                <Row label="Booked on">{formatCreated(booking.createdAt)}</Row>
              </div>

              {/* Intake answers */}
              {booking.intakeAnswers && Object.keys(booking.intakeAnswers).length > 0 && (
                <>
                  <p className="pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Questions</p>
                  <div className="rounded-xl border border-border bg-white divide-y divide-border mb-4">
                    {Object.entries(booking.intakeAnswers).map(([q, a]) => (
                      <Row key={q} label={q}>{a}</Row>
                    ))}
                  </div>
                </>
              )}

              {/* Notes */}
              {booking.notes && (
                <>
                  <p className="pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Notes</p>
                  <div className="rounded-xl border border-border bg-white mb-4 p-4">
                    <p className="text-sm text-ink whitespace-pre-wrap">{booking.notes}</p>
                  </div>
                </>
              )}

            </div>
          )}
        </div>

        {/* Footer actions */}
        {booking?.status === 'pending' && (
          <div className="shrink-0 border-t border-border px-5 py-4">
            <button
              disabled={confirming}
              onClick={() =>
                startConfirm(async () => {
                  await confirmBookingAction(booking.id)
                  onClose()
                })
              }
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {confirming ? 'Confirming…' : 'Confirm booking'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
