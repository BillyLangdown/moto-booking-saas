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

const STEPS = ['Password', 'Business', 'Services', 'Branding', 'Resources', 'Availability', 'Questions', 'Done'] as const

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
    <div className="bg-white shadow-sm p-5 flex flex-col gap-4">
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
          className="flex-1 border border-border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition"
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-4 py-2.5 bg-ink text-white text-sm font-medium hover:bg-ink/85 transition-colors shrink-0"
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

const inputClass = 'w-full border border-border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition'
const selectClass = 'w-full border border-border bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 transition'

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
        email, phone: tenant.phone, address: tenant.address,
        primaryColor: tenant.branding.primaryColor,
        accentColor:  tenant.branding.accentColor,
      })
      setSaving(false)
      setStep(2)

    } else if (step === 2) {
      setSaving(true)
      await updateTenantAction(tenant.id, {
        name, description,
        email, phone: tenant.phone, address: tenant.address,
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
        email, phone: tenant.phone, address: tenant.address,
        logoUrl: logoUrl || undefined,
        primaryColor: tenant.branding.primaryColor,
        accentColor:  tenant.branding.accentColor,
        sessionTypes,
      })
      setSaving(false)
      setStep(4)

    } else if (step === 4) {
      // Resources step - just advance, no saving yet
      setStep(5)

    } else if (step === 5) {
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
      setStep(6)

    } else if (step === 6) {
      setSaving(true)
      const finalQ = useExamples ? EXAMPLE_QUESTIONS : questions
      await saveIntakeQuestionsAction(tenant.id, finalQ)
      setSaving(false)
      setStep(7)

    } else {
      await completeOnboardingAction(tenant.id)
      router.push('/dashboard/bookings')
    }
  }

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
              <div key={i} className={`h-1 flex-1 transition-colors ${i <= step ? 'bg-white/80' : 'bg-white/15'}`} />
            ))}
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-white/40">Step {step + 1} of {STEPS.length}</span>
            <span className="text-xs font-medium text-white/70">{STEPS[step]}</span>
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
            <div className="bg-white shadow-sm p-5 flex flex-col gap-4">
              <Input label="Business name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input
                label="Contact email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" placeholder="bookings@yourbusiness.com"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-secondary">
                  Description <span className="normal-case font-normal text-muted">(shown on your booking page)</span>
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

        {/* Step 2 - Services */}
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
            <p className="text-xs text-secondary text-center">You can skip this and add service types later in Settings.</p>
          </>
        )}

        {/* Step 3 - Branding */}
        {step === 3 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Add your logo</h1>
              <p className="text-sm text-secondary mt-1">Optional - shown at the top of your booking page.</p>
            </div>
            <div className="bg-white shadow-sm p-5">
              <LogoUpload currentUrl={logoUrl || undefined} onUpload={setLogoUrl} />
            </div>
            <p className="text-xs text-secondary text-center">You can skip this and add a logo later in Settings.</p>
          </>
        )}

        {/* Step 4 - Resources */}
        {step === 4 && (
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

        {/* Step 5 - Availability */}
        {step === 5 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Working hours</h1>
              <p className="text-sm text-secondary mt-1">Set your available times. Add as many blocks as you need, then continue.</p>
            </div>

            <div className="bg-white shadow-sm flex flex-col overflow-hidden">
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
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${availMode === m ? 'text-ink border-b-2 border-ink -mb-px bg-white' : 'text-secondary hover:text-ink'}`}
                  >
                    {m === 'recurring' ? 'Recurring' : 'One-off'}
                  </button>
                ))}
              </div>

              <div className="px-5 py-4 flex flex-col gap-4" onFocus={() => setFormTouched(true)}>
                {availMode === 'recurring' && (
                  <>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-medium text-secondary uppercase tracking-wide">Repeat on</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {AVAIL_DAYS.map((d) => (
                          <button key={d.value} type="button"
                            onClick={() => { setAvailDays(p => p.includes(d.value) ? p.filter(x => x !== d.value) : [...p, d.value]); setFormTouched(true) }}
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-secondary uppercase tracking-wide">Start</label>
                    <input type="time" value={availStart} onChange={(e) => setAvailStart(e.target.value)} className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-secondary uppercase tracking-wide">End</label>
                    <input type="time" value={availEnd} onChange={(e) => setAvailEnd(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-secondary uppercase tracking-wide">Capacity (spots per slot)</label>
                  <input
                    type="number" min={1} placeholder="1"
                    value={capacityRaw}
                    onChange={(e) => setCapacityRaw(e.target.value)}
                    onBlur={(e) => setCapacityRaw(String(Math.max(1, parseInt(e.target.value, 10) || 1)))}
                    className={inputClass}
                  />
                </div>

                <div className="border-t border-border/50 pt-4 flex flex-col gap-3">
                  <p className="text-xs font-medium text-secondary uppercase tracking-wide">Refine (optional)</p>

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
                  className={`w-full bg-ink text-white px-3 py-2.5 text-sm font-medium hover:bg-ink/85 transition-all ${editingId ? 'ring-2 ring-offset-2 ring-amber-400 animate-pulse' : ''}`}
                >
                  {editingId
                    ? 'Save changes'
                    : `Add to schedule${formTouched && currentSlotCount > 0 ? ` (${currentSlotCount} slot${currentSlotCount !== 1 ? 's' : ''})` : ''}`
                  }
                </button>
              </div>
            </div>

            {patterns.length > 0 && (
              <div className="bg-white shadow-sm overflow-hidden">
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

        {/* Step 6 - Questions */}
        {step === 6 && (
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
            <p className="text-xs text-secondary text-center">You can edit these any time in Settings.</p>
          </>
        )}

        {/* Step 7 - Done */}
        {step === 7 && (
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
          {step > 0 && step < 7 ? (
            <button
              type="button"
              onClick={() => { setError(null); setStep(step - 1) }}
              className="text-sm text-secondary hover:text-ink transition-colors"
            >
              ← Back
            </button>
          ) : <div />}
          <Button onClick={handleNext} loading={saving}>
            {step === 7 ? 'Go to dashboard' : step === 6 ? 'Save & finish' : 'Continue →'}
          </Button>
        </div>
      </div>

    </div>
  )
}
