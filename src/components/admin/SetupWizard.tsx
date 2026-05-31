'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { IntakeQuestion, Tenant } from '@/types'
import { updateTenantAction, saveIntakeQuestionsAction, completeOnboardingAction, setPasswordAction, createResourceAction, createSlotsAction } from '@/app/actions'
import { generateRecurringDates } from './SlotCreateForm'
import type { CreateSlotInput } from '@/types'
import LogoUpload from './LogoUpload'
import IntakeBuilder from './IntakeBuilder'
import SessionTypeEditor from './SessionTypeEditor'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Props { tenant: Tenant }

const STEPS = ['Password', 'Business', 'Services', 'Branding', 'Availability', 'Questions', 'Done'] as const
type Step = typeof STEPS[number]

const EXAMPLE_QUESTIONS: IntakeQuestion[] = [
  { id: 'ex1', type: 'dropdown', label: 'Experience level', required: true, options: ['Beginner', 'Intermediate', 'Advanced', 'Professional'] },
  { id: 'ex2', type: 'number', label: 'Age', required: true },
  { id: 'ex3', type: 'yesno', label: 'Have you done this before?', required: false },
  { id: 'ex4', type: 'text', label: 'Any relevant qualifications?', required: false },
]

function passwordRules(pwd: string) {
  return {
    length:  pwd.length >= 8,
    upper:   /[A-Z]/.test(pwd),
    number:  /[0-9]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  }
}

function RuleRow({ met, label }: { met: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-emerald-600' : 'text-secondary'}`}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        {met
          ? <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          : <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.2"/>
        }
      </svg>
      {label}
    </span>
  )
}

const inputClass = 'w-full border border-border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition'

export default function SetupWizard({ tenant }: Props) {
  const router   = useRouter()
  const [step, setStep]     = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  // Password step
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPwd, setShowPwd]       = useState(false)

  // Business step
  const [name, setName]           = useState(tenant.name)
  const [description, setDesc]    = useState(tenant.description)

  // Services step
  const [sessionTypes, setSessionTypes] = useState<string[]>(tenant.sessionTypes ?? [])

  // Branding step
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl ?? '')

  // Availability step
  const [wizResources, setWizResources] = useState<Array<{ name: string; type: 'person' | 'asset' }>>([])
  const [resInput, setResInput]         = useState('')
  const [resType, setResType]           = useState<'person' | 'asset'>('person')
  const [availMode, setAvailMode]       = useState<'once' | 'recurring'>('recurring')
  const [availDays, setAvailDays]       = useState<number[]>([1, 2, 3, 4, 5])
  const [availFrom, setAvailFrom]       = useState(new Date().toISOString().split('T')[0])
  const [availUntil, setAvailUntil]     = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 56); return d.toISOString().split('T')[0]
  })
  const [availDate, setAvailDate]   = useState(new Date().toISOString().split('T')[0])
  const [availStart, setAvailStart] = useState('09:00')
  const [availEnd, setAvailEnd]     = useState('17:00')
  const [availCapacity, setAvailCapacity] = useState(1)

  const AVAIL_DAYS = [
    { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 }, { label: 'Sun', value: 0 },
  ]
  const recurDates = availMode === 'recurring' ? generateRecurringDates(availFrom, availUntil, availDays) : [availDate]
  const availSlotCount = recurDates.length * Math.max(wizResources.length, 1)

  function addResource() {
    const name = resInput.trim()
    if (!name) return
    setWizResources((prev) => [...prev, { name, type: resType }])
    setResInput('')
  }

  // Questions step
  const [questions, setQuestions]     = useState<IntakeQuestion[]>([])
  const [useExamples, setUseExamples] = useState(false)

  const rules = passwordRules(password)
  const allRulesMet = Object.values(rules).every(Boolean)

  async function handleNext() {
    setError(null)

    if (step === 0) {
      if (!allRulesMet) { setError('Password does not meet all requirements.'); return }
      if (password !== confirm) { setError('Passwords do not match.'); return }
      setSaving(true)
      const res = await setPasswordAction(password)
      setSaving(false)
      if (res.error) { setError(res.error); return }
      setStep(1)

    } else if (step === 1) {
      setSaving(true)
      await updateTenantAction(tenant.id, {
        name, description,
        email: tenant.email, phone: tenant.phone, address: tenant.address,
        primaryColor: tenant.branding.primaryColor,
        accentColor:  tenant.branding.accentColor,
      })
      setSaving(false)
      setStep(2)

    } else if (step === 2) {
      setSaving(true)
      await updateTenantAction(tenant.id, {
        name, description,
        email: tenant.email, phone: tenant.phone, address: tenant.address,
        primaryColor: tenant.branding.primaryColor,
        accentColor:  tenant.branding.accentColor,
        sessionTypes,
      })
      setSaving(false)
      setStep(3)

    } else if (step === 3) {
      setSaving(true)
      await updateTenantAction(tenant.id, {
        name, description,
        email: tenant.email, phone: tenant.phone, address: tenant.address,
        logoUrl: logoUrl || undefined,
        primaryColor: tenant.branding.primaryColor,
        accentColor:  tenant.branding.accentColor,
        sessionTypes,
      })
      setSaving(false)
      setStep(4)

    } else if (step === 4) {
      // Create resources, then slots for each
      setSaving(true)
      const createdIds: string[] = []
      for (const res of wizResources) {
        const r = await createResourceAction(tenant.id, res.name, res.type)
        if (r.error) { setError(r.error); setSaving(false); return }
        createdIds.push(r.resourceId!)
      }
      if (createdIds.length > 0) {
        const slotInputs: CreateSlotInput[] = createdIds.flatMap((resourceId) =>
          recurDates.map((date) => ({
            tenantId: tenant.id,
            resourceId,
            sessionType: '',
            date,
            startTime: availStart,
            endTime:   availEnd,
            capacity:  availCapacity,
          }))
        )
        if (slotInputs.length > 0) {
          const r = await createSlotsAction(slotInputs)
          if (r.error) { setError(r.error); setSaving(false); return }
        }
      }
      setSaving(false)
      setStep(5)

    } else if (step === 5) {
      setSaving(true)
      const finalQ = useExamples ? EXAMPLE_QUESTIONS : questions
      await saveIntakeQuestionsAction(tenant.id, finalQ)
      setSaving(false)
      setStep(6)

    } else {
      await completeOnboardingAction(tenant.id)
      router.push('/dashboard/bookings')
    }
  }

  const stepIndex = step
  const totalSteps = STEPS.length

  return (
    <div className="min-h-dvh flex flex-col">

      {/* Header + progress */}
      <div style={{ background: 'linear-gradient(180deg, #0D1117 0%, #1a2644 100%)' }}>
        <div className="mx-auto max-w-xl px-4 pt-5 pb-4">
          <div className="flex items-center gap-2.5 mb-5">
            <img src="/images/slick-logo.png" alt="Slick" className="h-7 w-auto object-contain" />
            <span className="text-sm font-semibold text-white">Setup</span>
          </div>
          <div className="flex gap-1 mb-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 transition-colors ${i <= stepIndex ? 'bg-white/80' : 'bg-white/15'}`}
              />
            ))}
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-white/40">Step {stepIndex + 1} of {totalSteps}</span>
            <span className="text-xs font-medium text-white/70">{STEPS[stepIndex]}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 mx-auto w-full max-w-xl px-4 py-8 flex flex-col gap-6">

        {/* Step 0 — Password */}
        {step === 0 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Set your password</h1>
              <p className="text-sm text-secondary mt-1">You'll use this to log in to your booking dashboard.</p>
            </div>
            <div className="bg-white shadow-sm p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">New password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-ink transition-colors text-xs"
                  >
                    {showPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">Confirm password</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  className={inputClass}
                />
              </div>

              {/* Rules */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <RuleRow met={rules.length}  label="At least 8 characters" />
                <RuleRow met={rules.upper}   label="One uppercase letter" />
                <RuleRow met={rules.number}  label="One number" />
                <RuleRow met={rules.special} label="One special character" />
              </div>
            </div>
          </>
        )}

        {/* Step 1 — Business */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Your business</h1>
              <p className="text-sm text-secondary mt-1">This appears on your public booking page.</p>
            </div>
            <div className="bg-white shadow-sm p-5 flex flex-col gap-4">
              <Input
                label="Business name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-secondary">
                  Description <span className="normal-case font-normal text-muted">(shown on your booking page)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  placeholder="What customers can expect when they book with you…"
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </>
        )}

        {/* Step 2 — Services */}
        {step === 2 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Your services</h1>
              <p className="text-sm text-secondary mt-1">
                Add the types of sessions or services customers can book. You can change these any time in Settings.
              </p>
            </div>
            <div className="bg-white shadow-sm p-5 flex flex-col gap-3">
              <SessionTypeEditor types={sessionTypes} onChange={setSessionTypes} />
            </div>
            <p className="text-xs text-secondary text-center">You can skip this and add service types later in Settings → Bookings.</p>
          </>
        )}

        {/* Step 3 — Branding */}
        {step === 3 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Add your logo</h1>
              <p className="text-sm text-secondary mt-1">Optional — shown at the top of your booking page.</p>
            </div>
            <div className="bg-white shadow-sm p-5">
              <LogoUpload currentUrl={logoUrl || undefined} onUpload={setLogoUrl} />
            </div>
            <p className="text-xs text-secondary text-center">You can skip this and add a logo later in Settings.</p>
          </>
        )}

        {/* Step 4 — Availability */}
        {step === 4 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Set your availability</h1>
              <p className="text-sm text-secondary mt-1">Add what you're scheduling and your working hours. You can change all of this later.</p>
            </div>

            {/* Resources */}
            <div className="bg-white shadow-sm p-5 flex flex-col gap-4">
              <div>
                <p className="text-sm font-semibold text-ink mb-0.5">What are customers booking?</p>
                <p className="text-xs text-secondary leading-relaxed">
                  Add the people or things customers will be booking — for example a staff member, a vehicle, a room, or a piece of equipment.
                  Each time slot is linked to one of these, so you always know who or what is booked.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={resInput}
                  onChange={(e) => setResInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addResource())}
                  placeholder="e.g. John Smith, Bike 1, Studio A"
                  className={inputClass}
                />
                <select value={resType} onChange={(e) => setResType(e.target.value as 'person' | 'asset')} className="w-full border border-border bg-white px-3 py-2.5 text-sm text-ink focus:outline-none">
                  <option value="person">Person (staff)</option>
                  <option value="asset">Asset (vehicle, room...)</option>
                </select>
                <button type="button" onClick={addResource} className="w-full bg-ink text-white px-3 py-2.5 text-sm font-medium hover:bg-ink/85 transition-colors">
                  Add resource
                </button>
              </div>
              {wizResources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {wizResources.map((r, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-subtle border border-border px-2.5 py-1 text-xs text-ink">
                      {r.name}
                      <span className="text-muted">·</span>
                      <span className="text-secondary">{r.type}</span>
                      <button type="button" onClick={() => setWizResources((p) => p.filter((_, j) => j !== i))} className="text-secondary hover:text-rose-500 transition-colors ml-0.5">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="bg-white shadow-sm flex flex-col overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <p className="text-sm font-semibold text-ink mb-0.5">Working hours</p>
                <p className="text-xs text-secondary">Set the times you're available for bookings.</p>
              </div>

              {/* Tabs */}
              <div className="flex border-y border-border">
                {(['recurring', 'once'] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setAvailMode(m)}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${availMode === m ? 'text-ink border-b-2 border-ink -mb-px bg-white' : 'text-secondary hover:text-ink'}`}
                  >
                    {m === 'recurring' ? 'Recurring' : 'One-off'}
                  </button>
                ))}
              </div>

              <div className="px-5 py-4 flex flex-col gap-4">
                {availMode === 'recurring' && (
                  <>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-medium text-secondary uppercase tracking-wide">Repeat on</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {AVAIL_DAYS.map((d) => (
                          <button key={d.value} type="button"
                            onClick={() => setAvailDays((p) => p.includes(d.value) ? p.filter((x) => x !== d.value) : [...p, d.value])}
                            className={`px-3 py-1.5 text-xs font-medium border transition-colors ${availDays.includes(d.value) ? 'bg-ink text-white border-ink' : 'bg-white text-secondary border-border hover:border-ink/30'}`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-secondary uppercase tracking-wide">From</label>
                        <input type="date" value={availFrom} onChange={(e) => setAvailFrom(e.target.value)} className={inputClass} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-secondary uppercase tracking-wide">Until</label>
                        <input type="date" value={availUntil} min={availFrom} onChange={(e) => setAvailUntil(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                  </>
                )}

                {availMode === 'once' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-secondary uppercase tracking-wide">Date</label>
                    <input type="date" value={availDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setAvailDate(e.target.value)} className={inputClass} />
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs font-medium text-secondary uppercase tracking-wide">Start</label>
                    <input type="time" value={availStart} onChange={(e) => setAvailStart(e.target.value)} className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs font-medium text-secondary uppercase tracking-wide">End</label>
                    <input type="time" value={availEnd} onChange={(e) => setAvailEnd(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-secondary uppercase tracking-wide">Capacity (spots per slot)</label>
                  <input type="number" min={1} max={100} value={availCapacity} onChange={(e) => setAvailCapacity(Number(e.target.value))} className={inputClass} />
                </div>

                {wizResources.length > 0 && recurDates.length > 0 && (
                  <div className="flex items-center gap-2 bg-subtle border border-border px-3 py-2 text-xs text-secondary">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M6 4v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Creates {availSlotCount} slot{availSlotCount !== 1 ? 's' : ''} across {wizResources.length} resource{wizResources.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-secondary text-center">You can skip this and configure availability from your dashboard.</p>
          </>
        )}

        {/* Step 5 — Questions */}
        {step === 5 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Booking questions</h1>
              <p className="text-sm text-secondary mt-1">
                Customers answer these before confirming. Collect anything useful upfront.
              </p>
            </div>
            <div className="bg-white shadow-sm p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUseExamples(true)}
                  className={`border-2 px-3 py-3 text-sm text-left transition-colors ${useExamples ? 'border-ink bg-subtle' : 'border-border hover:border-secondary'}`}
                >
                  <p className="font-semibold text-ink">Start from examples</p>
                  <p className="text-xs text-secondary mt-0.5">Experience, age, background</p>
                </button>
                <button
                  type="button"
                  onClick={() => setUseExamples(false)}
                  className={`border-2 px-3 py-3 text-sm text-left transition-colors ${!useExamples ? 'border-ink bg-subtle' : 'border-border hover:border-secondary'}`}
                >
                  <p className="font-semibold text-ink">Build from scratch</p>
                  <p className="text-xs text-secondary mt-0.5">Fully custom for your business</p>
                </button>
              </div>

              {useExamples ? (
                <ul className="flex flex-col gap-2">
                  {EXAMPLE_QUESTIONS.map((q) => (
                    <li key={q.id} className="flex items-center gap-2 text-sm text-secondary">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {q.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <IntakeBuilder questions={questions} onChange={setQuestions} />
              )}
            </div>
            <p className="text-xs text-secondary text-center">You can edit these any time in Settings → Questions.</p>
          </>
        )}

        {/* Step 6 — Done */}
        {step === 6 && (
          <div className="flex flex-col items-center text-center gap-6 py-8">
            <div className="flex h-14 w-14 items-center justify-center bg-emerald-100">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink">You&apos;re all set!</h1>
              <p className="text-sm text-secondary mt-2 max-w-sm">
                Your booking page is live. Share the link with your customers.
              </p>
            </div>
            <div className="w-full bg-white shadow-sm p-4 text-left flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Your booking link</span>
                <span className="font-mono text-sm text-accent break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/book/{tenant.slug}
                </span>
              </div>
              <div className="border-t border-border/50 pt-3 flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Next step</span>
                <p className="text-sm text-secondary">Go to <strong className="text-ink">Availability</strong> to add your first bookable slots.</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>
        )}
      </div>

      {/* Footer nav */}
      <div className="bg-white border-t border-border px-4 py-4 sticky bottom-0">
        <div className="mx-auto max-w-xl flex items-center justify-between">
          {step > 0 && step < 6 ? (
            <button
              type="button"
              onClick={() => { setError(null); setStep(step - 1) }}
              className="text-sm text-secondary hover:text-ink transition-colors"
            >
              ← Back
            </button>
          ) : <div />}
          <Button onClick={handleNext} loading={saving}>
            {step === 6 ? 'Go to dashboard' : step === 5 ? 'Save & finish' : 'Continue →'}
          </Button>
        </div>
      </div>

    </div>
  )
}
