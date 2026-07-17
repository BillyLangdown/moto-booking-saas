'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BookingMode, IntakeQuestion, Tenant } from '@/types'
import { updateTenantAction, saveIntakeQuestionsAction, completeOnboardingAction, setPasswordAction, createResourceAction, createSlotsAction } from '@/app/actions'
import { generateRecurringDates } from './SlotCreateForm'
import type { CreateSlotInput } from '@/types'
import LogoUpload from './LogoUpload'
import IntakeBuilder from './IntakeBuilder'
import SessionTypeEditor from './SessionTypeEditor'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Props { tenant: Tenant; userEmail?: string }

interface WizSlotPattern {
  id: string
  mode: 'recurring' | 'once'
  days: number[]
  from: string
  until: string
  date: string
  startTime: string
  endTime: string
  capacity: number
  sessionType: string
  staffName: string
  locationName: string
}

const STEPS = ['Password', 'Business', 'Booking', 'Services', 'Branding', 'Resources', 'Availability', 'Questions', 'Calendar', 'Done'] as const
const OPTIONAL_STEPS = new Set([3, 4, 5, 6, 7, 8])

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

function ResourceSection({
  label, sublabel, placeholder, items, input, onInputChange, onAdd, onRemove,
}: {
  label: string
  sublabel: string
  placeholder: string
  items: string[]
  input: string
  onInputChange: (v: string) => void
  onAdd: () => void
  onRemove: (i: number) => void
}) {
  return (
    <div className="bg-card shadow-sm p-5 flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-xs text-secondary mt-0.5">{sublabel}</p>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())}
          placeholder={placeholder}
          className="flex-1 border border-border bg-card px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition"
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-4 py-2.5 bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors shrink-0"
        >
          Add
        </button>
      </div>
      {items.length > 0 ? (
        <div className="flex flex-col divide-y divide-border/50 -mt-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-ink">{item}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-xs text-secondary hover:text-rose-500 transition-colors ml-4 shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted italic -mt-1">None added yet</p>
      )}
    </div>
  )
}

const inputClass = 'w-full border border-border bg-card px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition'
const selectClass = 'w-full border border-border bg-card px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 transition'

export default function SetupWizard({ tenant, userEmail = '' }: Props) {
  const router   = useRouter()
  const [step, setStep] = useState(() => {
    if (typeof window === 'undefined') return 0
    const s = new URLSearchParams(window.location.search).get('step')
    const n = s ? parseInt(s, 10) : 0
    return n >= 0 && n < STEPS.length ? n : 0
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  // Password step
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPwd, setShowPwd]   = useState(false)

  // Booking mode step
  const [bookingMode, setBookingMode]       = useState<BookingMode>(tenant.bookingMode ?? 'slotted')
  const [orlaContext, setOrlaContext]        = useState(tenant.orlaBusinessContext ?? '')
  const [orlaIntake, setOrlaIntake]          = useState(tenant.orlaIntakePrompt ?? '')
  const [generalAvailability, setGeneralAvailability] = useState(tenant.generalAvailability ?? '')

  // Business step
  const [name, setName]        = useState(tenant.name)
  const [email, setEmail]      = useState(tenant.email || userEmail)
  const [description, setDesc] = useState(tenant.description)

  // Services step
  const [sessionTypes, setSessionTypes] = useState<string[]>(tenant.sessionTypes ?? [])

  // Branding step
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl ?? '')

  // Resources step
  const [wizStaff, setWizStaff]           = useState<string[]>([])
  const [wizLocations, setWizLocations]   = useState<string[]>([])
  const [wizEquipment, setWizEquipment]   = useState<string[]>([])
  const [staffInput, setStaffInput]       = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [equipInput, setEquipInput]       = useState('')

  // Availability step
  const [availMode, setAvailMode]   = useState<'once' | 'recurring'>('recurring')
  const [availDays, setAvailDays]   = useState<number[]>([1, 2, 3, 4, 5])
  const [availFrom, setAvailFrom]   = useState(new Date().toISOString().split('T')[0])
  const [availUntil, setAvailUntil] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 56); return d.toISOString().split('T')[0]
  })
  const [availDate, setAvailDate]   = useState(new Date().toISOString().split('T')[0])
  const [availStart, setAvailStart] = useState('09:00')
  const [availEnd, setAvailEnd]     = useState('17:00')
  const [capacityRaw, setCapacityRaw]         = useState('1')
  const [slotSessionType, setSlotSessionType] = useState('')
  const [slotStaffName, setSlotStaffName]     = useState('')
  const [slotLocationName, setSlotLocationName] = useState('')
  const [patterns, setPatterns]     = useState<WizSlotPattern[]>([])
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [formTouched, setFormTouched] = useState(false)

  const AVAIL_DAYS = [
    { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 }, { label: 'Sun', value: 0 },
  ]
  const recurDates = availMode === 'recurring' ? generateRecurringDates(availFrom, availUntil, availDays) : [availDate]
  const totalResources = wizStaff.length + wizLocations.length + wizEquipment.length
  const currentSlotCount = recurDates.length * ((slotStaffName || slotLocationName) ? 1 : Math.max(totalResources, 1))

  function addPattern() {
    const capacity = Math.max(1, parseInt(capacityRaw, 10) || 1)
    const id = editingId ?? (Date.now().toString(36) + Math.random().toString(36).slice(2))
    const newPattern: WizSlotPattern = {
      id, mode: availMode, days: availDays, from: availFrom, until: availUntil,
      date: availDate, startTime: availStart, endTime: availEnd,
      capacity, sessionType: slotSessionType, staffName: slotStaffName, locationName: slotLocationName,
    }
    setPatterns(prev => editingId ? prev.map(p => p.id === editingId ? newPattern : p) : [...prev, newPattern])
    setEditingId(null)
    setFormTouched(false)
    setAvailMode('recurring')
    setAvailDays([1, 2, 3, 4, 5])
    setAvailStart('09:00')
    setAvailEnd('17:00')
    setCapacityRaw('1')
    setSlotSessionType('')
    setSlotStaffName('')
    setSlotLocationName('')
  }

  function editPattern(p: WizSlotPattern) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setFormTouched(true)
    setEditingId(p.id)
    setAvailMode(p.mode)
    setAvailDays(p.days)
    setAvailFrom(p.from)
    setAvailUntil(p.until)
    setAvailDate(p.date)
    setAvailStart(p.startTime)
    setAvailEnd(p.endTime)
    setCapacityRaw(String(p.capacity))
    setSlotSessionType(p.sessionType)
    setSlotStaffName(p.staffName)
    setSlotLocationName(p.locationName)
  }

  // Questions step
  const [questions, setQuestions]     = useState<IntakeQuestion[]>([])
  const [useExamples, setUseExamples] = useState(false)

  // Calendar step
  const [calLinkCopied, setCalLinkCopied] = useState(false)

  const rules = passwordRules(password)
  const allRulesMet = Object.values(rules).every(Boolean)

  async function handleNext() {
    setError(null)

    if (step === 0) {
      // Password
      if (!allRulesMet) { setError('Password does not meet all requirements.'); return }
      if (password !== confirm) { setError('Passwords do not match.'); return }
      setSaving(true)
      const res = await setPasswordAction(password)
      setSaving(false)
      if (res.error) { setError(res.error); return }
      setStep(1)

    } else if (step === 1) {
      // Business
      setSaving(true)
      await updateTenantAction(tenant.id, {
        name, description,
        email, phone: tenant.phone, address: tenant.address,
        primaryColor: tenant.branding.primaryColor,
        accentColor:  tenant.branding.accentColor,
      })
      setSaving(false)
      setStep(2)

    } else if (step === 2) {
      // Booking mode
      if (bookingMode === 'open' && !orlaContext.trim()) {
        setError('Please describe your business so Orla knows how to handle customer enquiries.')
        return
      }
      setSaving(true)
      await updateTenantAction(tenant.id, {
        name, description,
        email, phone: tenant.phone, address: tenant.address,
        primaryColor: tenant.branding.primaryColor,
        accentColor:  tenant.branding.accentColor,
        bookingMode,
        orlaBusinessContext: orlaContext || undefined,
        orlaIntakePrompt: orlaIntake || undefined,
        generalAvailability: generalAvailability || undefined,
      })
      setSaving(false)
      setStep(3)

    } else if (step === 3) {
      // Services
      setSaving(true)
      await updateTenantAction(tenant.id, {
        name, description,
        email, phone: tenant.phone, address: tenant.address,
        primaryColor: tenant.branding.primaryColor,
        accentColor:  tenant.branding.accentColor,
        sessionTypes,
        bookingMode,
      })
      setSaving(false)
      setStep(4)

    } else if (step === 4) {
      // Branding
      setSaving(true)
      await updateTenantAction(tenant.id, {
        name, description,
        email, phone: tenant.phone, address: tenant.address,
        logoUrl: logoUrl || undefined,
        primaryColor: tenant.branding.primaryColor,
        accentColor:  tenant.branding.accentColor,
        sessionTypes,
        bookingMode,
      })
      setSaving(false)
      // Skip Resources + Availability for open-book tenants
      setStep(bookingMode === 'open' ? 7 : 5)

    } else if (step === 5) {
      // Resources - just advance
      setStep(6)

    } else if (step === 6) {
      // Availability
      setEditingId(null)
      setSaving(true)
      const allCreated: Array<{ name: string; id: string; type: string }> = []
      for (const n of wizStaff) {
        const r = await createResourceAction(tenant.id, n, 'staff')
        if (r.error) { setError(r.error); setSaving(false); return }
        allCreated.push({ name: n, id: r.resourceId!, type: 'staff' })
      }
      for (const n of wizLocations) {
        const r = await createResourceAction(tenant.id, n, 'location')
        if (r.error) { setError(r.error); setSaving(false); return }
        allCreated.push({ name: n, id: r.resourceId!, type: 'location' })
      }
      for (const n of wizEquipment) {
        const r = await createResourceAction(tenant.id, n, 'resource')
        if (r.error) { setError(r.error); setSaving(false); return }
        allCreated.push({ name: n, id: r.resourceId!, type: 'resource' })
      }
      const allSlotInputs: CreateSlotInput[] = []
      for (const pattern of patterns) {
        const dates = pattern.mode === 'recurring'
          ? generateRecurringDates(pattern.from, pattern.until, pattern.days)
          : [pattern.date]
        let resourceIds: (string | undefined)[]
        if (pattern.staffName) {
          const match = allCreated.find(r => r.name === pattern.staffName && r.type === 'staff')
          resourceIds = [match?.id]
        } else if (pattern.locationName) {
          const match = allCreated.find(r => r.name === pattern.locationName && r.type === 'location')
          resourceIds = [match?.id]
        } else if (allCreated.length > 0) {
          resourceIds = allCreated.map(r => r.id)
        } else {
          resourceIds = [undefined]
        }
        for (const resourceId of resourceIds) {
          for (const date of dates) {
            allSlotInputs.push({
              tenantId: tenant.id, resourceId,
              sessionType: pattern.sessionType,
              date, startTime: pattern.startTime, endTime: pattern.endTime,
              capacity: pattern.capacity,
            })
          }
        }
      }
      if (allSlotInputs.length > 0) {
        const r = await createSlotsAction(allSlotInputs)
        if (r.error) { setError(r.error); setSaving(false); return }
      }
      setSaving(false)
      setStep(7)

    } else if (step === 7) {
      // Questions
      setSaving(true)
      const finalQ = useExamples ? EXAMPLE_QUESTIONS : questions
      await saveIntakeQuestionsAction(tenant.id, finalQ)
      setSaving(false)
      setStep(8)

    } else if (step === 8) {
      // Calendar — optional, nothing to save
      setStep(9)

    } else {
      // Done
      await completeOnboardingAction(tenant.id)
      router.push('/dashboard/bookings')
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">

      {/* Header + progress */}
      <div style={{ background: '#1F2937' }}>
        <div className="mx-auto max-w-xl px-4 pt-5 pb-4">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="text-sm font-semibold text-white tracking-[0.18em] uppercase">orla</span>
            <span className="text-sm text-white/30">·</span>
            <span className="text-sm text-white/50">Setup</span>
          </div>
          <div className="flex gap-1 mb-2">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 transition-colors ${i <= step ? 'bg-white/80' : 'bg-white/15'}`} />
            ))}
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-white/40">Step {step + 1} of {STEPS.length}</span>
            <span className="text-xs font-medium text-white/70">
              {STEPS[step]}{OPTIONAL_STEPS.has(step) ? <span className="text-white/40 font-normal"> (optional)</span> : null}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 mx-auto w-full max-w-xl px-4 py-8 flex flex-col gap-6">

        {/* Step 0 - Password */}
        {step === 0 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Set your password</h1>
              <p className="text-sm text-secondary mt-1">You'll use this to log in to your booking dashboard.</p>
            </div>
            <div className="bg-card shadow-sm p-5 flex flex-col gap-4">
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
              <div className="grid grid-cols-2 gap-2 pt-1">
                <RuleRow met={rules.length}  label="At least 8 characters" />
                <RuleRow met={rules.upper}   label="One uppercase letter" />
                <RuleRow met={rules.number}  label="One number" />
                <RuleRow met={rules.special} label="One special character" />
              </div>
            </div>
          </>
        )}

        {/* Step 1 - Business */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Your business</h1>
              <p className="text-sm text-secondary mt-1">This appears on your public booking page.</p>
            </div>
            <div className="bg-card shadow-sm p-5 flex flex-col gap-4">
              <Input label="Business name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input
                label="Contact email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" placeholder="bookings@yourbusiness.com"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary">
                  Description <span className="font-normal text-muted">(shown on your booking page)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  placeholder="What customers can expect when they book with you..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </>
        )}

        {/* Step 2 - Booking mode */}
        {step === 2 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">How do customers book?</h1>
              <p className="text-sm text-secondary mt-1">
                Choose how customers will make a booking with you. You can change this later in Settings.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {([
                ['slotted', 'Fixed time slots', 'Customers choose from times you set in advance. Best for classes, lessons, and appointments.'],
                ['open', 'Open enquiry', 'Customers chat with Orla to describe what they need. You review and confirm. Best for project-based or custom work.'],
              ] as const).map(([mode, label, desc]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setBookingMode(mode)}
                  className={`bg-card shadow-sm border-2 px-5 py-4 text-left transition-colors ${bookingMode === mode ? 'border-ink' : 'border-transparent hover:border-border'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${bookingMode === mode ? 'border-ink' : 'border-border'}`}>
                      {bookingMode === mode && <div className="h-2 w-2 rounded-full bg-ink" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{label}</p>
                      <p className="text-xs text-secondary mt-0.5">{desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {bookingMode === 'open' && (
              <>
                <div className="bg-card shadow-sm p-5 flex flex-col gap-3">
                  <div>
                    <label className="text-sm font-semibold text-ink">About your business</label>
                    <p className="text-xs text-secondary mt-0.5">
                      Tell Orla what your business does, what services you offer, and your area. This lets her understand what customers are describing. Required.
                    </p>
                  </div>
                  <textarea
                    value={orlaContext}
                    onChange={e => setOrlaContext(e.target.value)}
                    rows={5}
                    placeholder={`e.g. We are a residential plumbing company based in Bristol. We cover leak repairs, boiler servicing, bathroom installations, and blocked drains. We work across Bristol and within 15 miles. We do not cover commercial properties.`}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="bg-card shadow-sm p-5 flex flex-col gap-3">
                  <div>
                    <label className="text-sm font-semibold text-ink">Working hours</label>
                    <p className="text-xs text-secondary mt-0.5">
                      Describe when you&apos;re available. Orla shares this with customers during their enquiry chat.
                    </p>
                  </div>
                  <textarea
                    value={generalAvailability}
                    onChange={e => setGeneralAvailability(e.target.value)}
                    rows={4}
                    placeholder={`e.g. We work Monday to Friday, 7:30am – 5:00pm. We do not take bookings on bank holidays or weekends. Lead time is typically 2–3 weeks for new projects.`}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="bg-card shadow-sm p-5 flex flex-col gap-3">
                  <div>
                    <label className="text-sm font-semibold text-ink">What Orla should collect</label>
                    <p className="text-xs text-secondary mt-0.5">
                      Tell Orla what specific details to gather before submitting an enquiry.
                    </p>
                  </div>
                  <textarea
                    value={orlaIntake}
                    onChange={e => setOrlaIntake(e.target.value)}
                    rows={4}
                    placeholder="e.g. Ask for: type of issue, location in the property, how long it has been happening, whether it is an emergency. Always collect name, email, and phone number."
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Step 3 - Services (was 2) */}
        {step === 3 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Your services</h1>
              <p className="text-sm text-secondary mt-1">
                Add the types of sessions or services customers can book. You can change these any time in Settings.
              </p>
            </div>
            <div className="bg-card shadow-sm p-5 flex flex-col gap-3">
              <SessionTypeEditor types={sessionTypes} onChange={setSessionTypes} />
            </div>
            <p className="text-xs text-secondary text-center">You can skip this and add service types later in Settings.</p>
          </>
        )}

        {/* Step 4 - Branding (was 3) */}
        {step === 4 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Add your logo</h1>
              <p className="text-sm text-secondary mt-1">Optional - shown at the top of your booking page.</p>
            </div>
            <div className="bg-card shadow-sm p-5">
              <LogoUpload currentUrl={logoUrl || undefined} onUpload={setLogoUrl} />
            </div>
            <p className="text-xs text-secondary text-center">You can skip this and add a logo later in Settings.</p>
          </>
        )}

        {/* Step 5 - Resources (was 4) */}
        {step === 5 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">What are customers booking?</h1>
              <p className="text-sm text-secondary mt-1">
                Add the staff, locations, and equipment customers will be booking. All are optional.
              </p>
            </div>
            <ResourceSection
              label="Staff members"
              sublabel="People customers book with, e.g. instructors, coaches, therapists."
              placeholder="e.g. John Smith"
              items={wizStaff}
              input={staffInput}
              onInputChange={setStaffInput}
              onAdd={() => { const v = staffInput.trim(); if (v) { setWizStaff(p => [...p, v]); setStaffInput('') } }}
              onRemove={(i) => setWizStaff(p => p.filter((_, j) => j !== i))}
            />
            <ResourceSection
              label="Locations"
              sublabel="Rooms, courts, studios, tracks - physical spaces customers book into."
              placeholder="e.g. Studio A, Track 1"
              items={wizLocations}
              input={locationInput}
              onInputChange={setLocationInput}
              onAdd={() => { const v = locationInput.trim(); if (v) { setWizLocations(p => [...p, v]); setLocationInput('') } }}
              onRemove={(i) => setWizLocations(p => p.filter((_, j) => j !== i))}
            />
            <ResourceSection
              label="Equipment & vehicles"
              sublabel="Bikes, cameras, gear - physical items attached to a booking."
              placeholder="e.g. Bike 1, Camera Rig A"
              items={wizEquipment}
              input={equipInput}
              onInputChange={setEquipInput}
              onAdd={() => { const v = equipInput.trim(); if (v) { setWizEquipment(p => [...p, v]); setEquipInput('') } }}
              onRemove={(i) => setWizEquipment(p => p.filter((_, j) => j !== i))}
            />
            <p className="text-xs text-secondary text-center">You can add and edit these any time from your dashboard.</p>
          </>
        )}

        {/* Step 6 - Availability (was 5) */}
        {step === 6 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Working hours</h1>
              <p className="text-sm text-secondary mt-1">Set your available times. Add as many blocks as you need, then continue.</p>
            </div>

            <div className="bg-card shadow-sm flex flex-col overflow-hidden">
              {editingId && (
                <div className="flex items-center justify-between gap-3 px-5 py-3 bg-amber-50 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-amber-600">
                      <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-xs font-medium text-amber-800">Editing block - update below and click Save changes</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-xs text-amber-700 hover:text-amber-900 transition-colors shrink-0 underline underline-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div className="flex border-b border-border">
                {(['recurring', 'once'] as const).map((m) => (
                  <button key={m} type="button" onClick={() => { setAvailMode(m); setFormTouched(true) }}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${availMode === m ? 'text-ink border-b-2 border-ink -mb-px bg-card' : 'text-secondary hover:text-ink'}`}
                  >
                    {m === 'recurring' ? 'Recurring' : 'One-off'}
                  </button>
                ))}
              </div>

              <div className="px-5 py-4 flex flex-col gap-4" onFocus={() => setFormTouched(true)}>
                {availMode === 'recurring' && (
                  <>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-medium text-secondary">Repeat on</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {AVAIL_DAYS.map((d) => (
                          <button key={d.value} type="button"
                            onClick={() => { setAvailDays(p => p.includes(d.value) ? p.filter(x => x !== d.value) : [...p, d.value]); setFormTouched(true) }}
                            className={`px-3 py-1.5 text-xs font-medium border transition-colors ${availDays.includes(d.value) ? 'bg-accent text-white border-accent' : 'bg-card text-secondary border-border hover:border-ink/30'}`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-secondary">From</label>
                        <input type="date" value={availFrom} onChange={(e) => setAvailFrom(e.target.value)} className={inputClass} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-secondary">Until</label>
                        <input type="date" value={availUntil} min={availFrom} onChange={(e) => setAvailUntil(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                  </>
                )}

                {availMode === 'once' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-secondary">Date</label>
                    <input type="date" value={availDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setAvailDate(e.target.value)} className={inputClass} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-secondary">Start</label>
                    <input type="time" value={availStart} onChange={(e) => setAvailStart(e.target.value)} className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-secondary">End</label>
                    <input type="time" value={availEnd} onChange={(e) => setAvailEnd(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-secondary">Capacity (spots per slot)</label>
                  <input
                    type="number" min={1} placeholder="1"
                    value={capacityRaw}
                    onChange={(e) => setCapacityRaw(e.target.value)}
                    onBlur={(e) => setCapacityRaw(String(Math.max(1, parseInt(e.target.value, 10) || 1)))}
                    className={inputClass}
                  />
                </div>

                <div className="border-t border-border/50 pt-4 flex flex-col gap-3">
                  <p className="text-xs font-medium text-secondary">Refine (optional)</p>

                  {sessionTypes.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-secondary">Service</label>
                      <select value={slotSessionType} onChange={(e) => setSlotSessionType(e.target.value)} className={selectClass}>
                        <option value="">Any service</option>
                        {sessionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}

                  {wizStaff.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-secondary">Staff member</label>
                      <select value={slotStaffName} onChange={(e) => setSlotStaffName(e.target.value)} className={selectClass}>
                        <option value="">Any staff</option>
                        {wizStaff.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}

                  {wizLocations.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-secondary">Location</label>
                      <select value={slotLocationName} onChange={(e) => setSlotLocationName(e.target.value)} className={selectClass}>
                        <option value="">Any location</option>
                        {wizLocations.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={addPattern}
                  className={`w-full bg-accent text-white px-3 py-2.5 text-sm font-medium hover:bg-accent-hover transition-all ${editingId ? 'ring-2 ring-offset-2 ring-amber-400 animate-pulse' : ''}`}
                >
                  {editingId
                    ? 'Save changes'
                    : `Add to schedule${formTouched && currentSlotCount > 0 ? ` (${currentSlotCount} slot${currentSlotCount !== 1 ? 's' : ''})` : ''}`
                  }
                </button>
              </div>
            </div>

            {patterns.length > 0 && (
              <div className="bg-card shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b border-border">
                  <p className="text-sm font-semibold text-ink">
                    Schedule ({patterns.length} block{patterns.length !== 1 ? 's' : ''})
                  </p>
                </div>
                <div className="divide-y divide-border/50">
                  {patterns.map(p => {
                    const DAY_SHORT: Record<number, string> = {1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat',0:'Sun'}
                    const dayStr = p.mode === 'recurring'
                      ? [...p.days].sort((a,b) => (a===0?7:a)-(b===0?7:b)).map(d => DAY_SHORT[d]).join(', ')
                      : p.date
                    return (
                      <div key={p.id} className={`flex items-start gap-3 px-5 py-3 transition-colors ${editingId === p.id ? 'bg-amber-50 border-l-2 border-amber-400' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink">{p.startTime} - {p.endTime}</p>
                          <p className="text-xs text-secondary mt-0.5">
                            {dayStr}{p.mode === 'recurring' ? ` · ${p.from} to ${p.until}` : ''}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {p.sessionType && <span className="text-xs bg-subtle border border-border px-2 py-0.5 text-ink">{p.sessionType}</span>}
                            {p.staffName && <span className="text-xs bg-subtle border border-border px-2 py-0.5 text-ink">{p.staffName}</span>}
                            {p.locationName && <span className="text-xs bg-subtle border border-border px-2 py-0.5 text-ink">{p.locationName}</span>}
                            <span className="text-xs text-secondary">{p.capacity} spot{p.capacity !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="flex gap-3 shrink-0 pt-0.5">
                          <button type="button" onClick={() => editPattern(p)} className="text-xs text-secondary hover:text-ink transition-colors">Edit</button>
                          <button
                            type="button"
                            onClick={() => { setPatterns(prev => prev.filter(x => x.id !== p.id)); if (editingId === p.id) setEditingId(null) }}
                            className="text-xs text-secondary hover:text-rose-500 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <p className="text-xs text-secondary text-center">You can skip this and configure availability from your dashboard.</p>
          </>
        )}

        {/* Step 7 - Questions (was 6) */}
        {step === 7 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Booking questions</h1>
              <p className="text-sm text-secondary mt-1">
                Customers answer these before confirming. Collect anything useful upfront.
              </p>
            </div>
            <div className="bg-card shadow-sm p-5 flex flex-col gap-4">
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
            <p className="text-xs text-secondary text-center">You can edit these any time in Settings.</p>
          </>
        )}

        {/* Step 8 - Calendar */}
        {step === 8 && (() => {
          const icalUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/api/cal/${tenant.slug}?token=${tenant.icalToken}`
            : `/api/cal/${tenant.slug}?token=${tenant.icalToken}`
          const connectGoogleUrl = `/api/auth/google?tenant_id=${tenant.id}&return_to=${encodeURIComponent('/setup?step=8')}`
          return (
            <>
              <div>
                <h1 className="text-2xl font-bold text-ink">Connect your calendar</h1>
                <p className="text-sm text-secondary mt-1">
                  Keep your bookings in sync with the calendar app you already use. Both are optional.
                </p>
              </div>

              {/* Google Calendar */}
              <div className="bg-card shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <svg viewBox="0 0 48 48" className="w-8 h-8 shrink-0 mt-0.5" aria-hidden="true">
                    <rect fill="#fff" x="6" y="6" width="36" height="36" rx="3"/>
                    <path fill="#1a73e8" d="M33 6H15A9 9 0 0 0 6 15v18a9 9 0 0 0 9 9h18a9 9 0 0 0 9-9V15a9 9 0 0 0-9-9z"/>
                    <rect fill="#fff" x="10" y="10" width="28" height="28" rx="2"/>
                    <path fill="#1a73e8" d="M24 22.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z"/>
                    <path fill="#ea4335" d="M24 12v4"/>
                    <path fill="#34a853" d="M36 24h-4"/>
                    <path fill="#fbbc04" d="M24 36v-4"/>
                    <path fill="#ea4335" d="M12 24h4"/>
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">Google Calendar</p>
                    <p className="text-xs text-secondary mt-0.5">
                      When you confirm a booking, it appears in your Google Calendar automatically.
                    </p>
                  </div>
                </div>
                {tenant.googleConnected ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-100">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                      <path d="M2.5 7l3 3 6-6" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-xs text-emerald-700 font-medium">
                      Connected{tenant.googleConnectedEmail ? ` · ${tenant.googleConnectedEmail}` : ''}
                    </span>
                  </div>
                ) : (
                  <a
                    href={connectGoogleUrl}
                    className="flex items-center justify-center gap-2 w-full bg-accent text-white px-3 py-2.5 text-sm font-medium hover:bg-accent-hover transition-colors"
                  >
                    Connect Google Calendar
                  </a>
                )}
              </div>

              {/* iCal / Apple Calendar */}
              <div className="bg-card shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <svg viewBox="0 0 48 48" className="w-8 h-8 shrink-0 mt-0.5" aria-hidden="true">
                    <rect fill="#fff" x="4" y="4" width="40" height="40" rx="8"/>
                    <rect fill="#f97316" x="4" y="4" width="40" height="12" rx="8"/>
                    <rect fill="#f97316" x="4" y="10" width="40" height="6"/>
                    <rect fill="#fff" x="4" y="10" width="40" height="34" rx="0"/>
                    <rect fill="#fff" x="4" y="10" width="40" height="34" rx="8"/>
                    <path fill="#1e293b" d="M15 26h4v4h-4zm7 0h4v4h-4zm7 0h4v4h-4zm-14 7h4v4h-4zm7 0h4v4h-4z"/>
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">Apple Calendar, Outlook, and others</p>
                    <p className="text-xs text-secondary mt-0.5">
                      Subscribe to your booking feed. Any calendar app that supports iCal can use this link.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={icalUrl}
                    className="flex-1 border border-border bg-subtle px-3 py-2 text-xs font-mono text-secondary focus:outline-none"
                    onFocus={e => e.target.select()}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(icalUrl)
                      setCalLinkCopied(true)
                      setTimeout(() => setCalLinkCopied(false), 2000)
                    }}
                    className="shrink-0 px-3 py-2 bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors"
                  >
                    {calLinkCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-muted">
                  In Apple Calendar: File &gt; New Calendar Subscription and paste this link. In Outlook: Add calendar &gt; From internet.
                </p>
              </div>
            </>
          )
        })()}

        {/* Step 9 - Done */}
        {step === 9 && (
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
            <div className="w-full bg-card shadow-sm p-4 text-left flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-secondary">Your booking link</span>
                <span className="font-mono text-sm text-accent break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/book/{tenant.slug}
                </span>
              </div>
              <div className="border-t border-border/50 pt-3 flex flex-col gap-1">
                <span className="text-xs font-medium text-secondary">Next step</span>
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
      <div className="bg-card border-t border-border px-4 py-4 sticky bottom-0">
        <div className="mx-auto max-w-xl flex items-center justify-between">
          {step > 0 && step < 9 ? (
            <button
              type="button"
              onClick={() => {
                setError(null)
                // Open-book skips Resources (5) and Availability (6); skip them on back too
                if (step === 7 && bookingMode === 'open') { setStep(4) }
                else { setStep(step - 1) }
              }}
              className="text-sm text-secondary hover:text-ink transition-colors"
            >
              ← Back
            </button>
          ) : <div />}
          <Button onClick={handleNext} loading={saving}>
            {step === 9 ? 'Go to dashboard' : step === 7 ? 'Save & finish' : 'Continue →'}
          </Button>
        </div>
      </div>

    </div>
  )
}
