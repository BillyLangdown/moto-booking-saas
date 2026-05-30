'use client'

import { useState, FormEvent } from 'react'
import type { AvailabilitySlot, Booking, CreateBookingInput, IntakeQuestion } from '@/types'
import { createBookingAction } from '@/app/actions'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Props {
  slot: AvailabilitySlot
  tenantId: string
  intakeQuestions: IntakeQuestion[]
  onBack: () => void
  onSuccess: (booking: Booking) => void
}

function IntakeField({
  question,
  value,
  onChange,
}: {
  question: IntakeQuestion
  value: string
  onChange: (v: string) => void
}) {
  const inputClass = 'w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent transition'

  if (question.type === 'dropdown') {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">
          {question.label}
          {question.required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">Select…</option>
          {(question.options ?? []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    )
  }

  if (question.type === 'yesno') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink">
          {question.label}
          {question.required && <span className="text-rose-500 ml-0.5">*</span>}
        </p>
        <div className="flex gap-2">
          {['Yes', 'No'].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt.toLowerCase())}
              className={`flex-1 rounded-lg border-2 py-2.5 text-sm font-medium transition-all ${
                value === opt.toLowerCase()
                  ? 'border-accent bg-accent/5 text-accent'
                  : 'border-border text-secondary hover:border-secondary'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">
        {question.label}
        {question.required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <input
        type={question.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        placeholder={question.type === 'number' ? '0' : 'Your answer…'}
      />
    </div>
  )
}

export default function BookingForm({ slot, tenantId, intakeQuestions, onBack, onSuccess }: Props) {
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting]   = useState(false)

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim())  e.name = 'Name is required'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email'
    for (const q of intakeQuestions) {
      if (q.required && !answers[q.id]?.trim()) {
        e[q.id] = 'This is required'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setServerError(null)
    setSubmitting(true)
    try {
      const input: CreateBookingInput = {
        tenantId,
        slotId:       slot.id,
        resourceId:   slot.resourceId,
        name:         name.trim(),
        email:        email.trim().toLowerCase(),
        phone:        phone.trim() || undefined,
        licenceType:  slot.licenceType,
        intakeAnswers: answers,
        startTime:    new Date(`${slot.date}T${slot.startTime}:00`).toISOString(),
        endTime:      new Date(`${slot.date}T${slot.endTime}:00`).toISOString(),
      }
      const booking = await createBookingAction(input)
      onSuccess(booking)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const slotDate = new Date(`${slot.date}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-secondary hover:text-ink transition-colors w-fit">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back
      </button>

      {/* Selected slot */}
      <div className="rounded-xl border border-border bg-subtle p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary mb-2">Your session</p>
        <p className="text-base font-semibold text-ink">{slotDate}</p>
        <p className="text-sm text-secondary mt-0.5">{slot.startTime} – {slot.endTime} · {slot.resource.name}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Intake questions */}
        {intakeQuestions.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-ink">A few quick questions</p>
            {intakeQuestions.map((q) => (
              <div key={q.id}>
                <IntakeField question={q} value={answers[q.id] ?? ''} onChange={(v) => setAnswer(q.id, v)} />
                {errors[q.id] && <p className="text-xs text-rose-600 mt-1">{errors[q.id]}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Contact details */}
        <div className="flex flex-col gap-4">
          {intakeQuestions.length > 0 && (
            <p className="text-sm font-semibold text-ink border-t border-border pt-4">Your details</p>
          )}
          <Input
            label="Full name"
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
          <Input
            label="Phone number (optional)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="+44 7700 900000"
          />
        </div>

        {serverError && (
          <p className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2.5 text-sm text-rose-700">
            {serverError}
          </p>
        )}
        <Button type="submit" loading={submitting} size="lg" className="w-full">
          Confirm booking
        </Button>
        <p className="text-xs text-secondary text-center">
          You&apos;ll receive a confirmation email once your booking is placed.
        </p>
      </form>
    </div>
  )
}
