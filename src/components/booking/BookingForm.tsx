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
  price?: { label: string; sub?: string }
  hideHeader?: boolean
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
  const inputClass = 'w-full border border-border bg-white px-3.5 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/20 transition rounded-md'

  if (question.type === 'dropdown') {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink">
          {question.label}
          {question.required && <span className="text-rose-400 ml-0.5">*</span>}
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
          {question.required && <span className="text-rose-400 ml-0.5">*</span>}
        </p>
        <div className="flex gap-2">
          {['Yes', 'No'].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt.toLowerCase())}
              className={`flex-1 border rounded-md py-3 text-sm font-medium transition-all ${
                value === opt.toLowerCase()
                  ? 'border-accent bg-accent/8 text-accent'
                  : 'border-border text-secondary hover:border-secondary bg-white'
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
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-ink">
        {question.label}
        {question.required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      <input
        type={question.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        placeholder={question.type === 'number' ? '0' : ''}
      />
    </div>
  )
}

export default function BookingForm({ slot, tenantId, intakeQuestions, onBack, onSuccess, price, hideHeader = false }: Props) {
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [serverError, setServerError]   = useState<string | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [redirecting, setRedirecting]   = useState(false)

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
    const input: CreateBookingInput = {
      tenantId,
      slotId:        slot.id,
      resourceId:    slot.resourceId ?? '',
      name:          name.trim(),
      email:         email.trim().toLowerCase(),
      phone:         phone.trim() || undefined,
      sessionType:   slot.sessionType,
      intakeAnswers: Object.fromEntries(
        intakeQuestions.map(q => [q.label, answers[q.id] ?? ''])
          .filter(([, v]) => v !== '')
      ),
      startTime:     `${slot.date}T${slot.startTime}:00.000Z`,
      endTime:       `${slot.date}T${slot.endTime}:00.000Z`,
    }
    const result = await createBookingAction(input)
    if (result.error) {
      setServerError(result.error)
      setSubmitting(false)
    } else if (result.checkoutUrl) {
      setRedirecting(true)
      window.location.href = result.checkoutUrl
    } else if (result.booking) {
      onSuccess(result.booking)
    }
  }

  const slotDate = new Date(`${slot.date}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="flex flex-col gap-7">
      {!hideHeader && (
        <>
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-secondary hover:text-ink transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back
            </button>
          </div>

          <div className="bg-accent/8 border border-accent/15 rounded-lg px-4 py-3 flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            <div>
              <p className="text-xs font-medium text-accent">{slotDate}</p>
              <p className="text-xs text-accent/70 mt-0.5">{slot.startTime} – {slot.endTime}{slot.resource ? ` · ${slot.resource.name}` : ''}</p>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {intakeQuestions.length > 0 && (
          <div className="flex flex-col gap-5">
            <p className="text-sm font-medium text-ink">A few quick questions</p>
            {intakeQuestions.map((q) => (
              <div key={q.id}>
                <IntakeField question={q} value={answers[q.id] ?? ''} onChange={(v) => setAnswer(q.id, v)} />
                {errors[q.id] && <p className="text-xs text-rose-500 mt-1.5">{errors[q.id]}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {intakeQuestions.length > 0 && (
            <div className="border-t border-border pt-5">
              <p className="text-sm font-medium text-ink">Your details</p>
            </div>
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
            label="Phone (optional)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="+44 7700 900000"
          />
        </div>

        {serverError && (
          <p className="bg-rose-50 border border-rose-100 rounded-md px-4 py-3 text-sm text-rose-600">
            {serverError}
          </p>
        )}

        <div className="flex flex-col gap-3 pt-1">
          <Button type="submit" loading={submitting || redirecting} size="lg" className="w-full">
            {redirecting
              ? 'Redirecting to payment…'
              : price
                ? `Pay ${price.label}`
                : 'Confirm booking'}
          </Button>
          {price?.sub && (
            <p className="text-xs text-muted text-center">{price.sub} total</p>
          )}
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-secondary hover:text-ink transition-colors text-center py-1"
          >
            Back to times
          </button>
        </div>

        <p className="text-xs text-muted text-center">
          {price
            ? 'You\'ll be taken to a secure payment page after confirming.'
            : 'A confirmation email will be sent once your booking is placed.'}
        </p>
      </form>
    </div>
  )
}
