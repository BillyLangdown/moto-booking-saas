'use client'

import { useState, FormEvent } from 'react'
import type { AvailabilitySlot, Booking, CreateBookingInput } from '@/types'
import { createBookingAction } from '@/app/actions'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'

interface Props {
  slot: AvailabilitySlot
  tenantId: string
  onBack: () => void
  onSuccess: (booking: Booking) => void
}

interface FormErrors {
  name?: string
  email?: string
}

export default function BookingForm({ slot, tenantId, onBack, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const e: FormErrors = {}
    if (!name.trim()) e.name = 'Name is required.'
    if (!email.trim()) {
      e.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Enter a valid email address.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const input: CreateBookingInput = {
        tenantId,
        slotId: slot.id,
        resourceId: slot.resourceId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        notes: notes.trim() || undefined,
        licenceType: slot.licenceType,
        startTime: new Date(`${slot.date}T${slot.startTime}:00`).toISOString(),
        endTime:   new Date(`${slot.date}T${slot.endTime}:00`).toISOString(),
      }
      const booking = await createBookingAction(input)
      onSuccess(booking)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-secondary hover:text-ink transition-colors w-fit"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to slots
      </button>

      {/* Selected slot summary */}
      <div className="rounded-xl border border-border bg-subtle p-4 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Selected slot</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="licence" value={slot.licenceType} />
          <span className="text-sm font-semibold text-ink">
            {slot.startTime} – {slot.endTime}
          </span>
        </div>
        <p className="text-sm text-secondary">
          {new Date(`${slot.date}T00:00:00`).toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long',
          })}
          {' · '}
          {slot.resource.name}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Full name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
          autoComplete="name"
          placeholder="Jane Smith"
        />
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
          autoComplete="email"
          placeholder="jane@example.com"
        />
        <Textarea
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any experience level, questions, or requirements…"
        />
        <Button type="submit" loading={submitting} size="lg" className="w-full mt-2">
          Confirm booking
        </Button>
      </form>
    </div>
  )
}
