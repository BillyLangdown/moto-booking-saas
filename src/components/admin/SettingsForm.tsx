'use client'

import { useState, FormEvent } from 'react'
import type { IntakeQuestion, Resource, Tenant } from '@/types'
import { updateTenantAction, saveIntakeQuestionsAction, createResourceAction, deleteResourceAction } from '@/app/actions'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import LogoUpload from './LogoUpload'
import IntakeBuilder from './IntakeBuilder'
import SessionTypeEditor from './SessionTypeEditor'
import BookingPageLink from './BookingPageLink'
import PaymentSettings from './PaymentSettings'

interface Props { tenant: Tenant; slotSessionTypes?: string[]; resources?: Resource[] }

type View = 'menu' | 'business' | 'services' | 'booking' | 'questions' | 'payments'

const inputClass = 'w-full bg-white border border-border px-3 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 transition rounded-md'

// ─── Menu primitives ──────────────────────────────────────────────────────────

function MenuGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-border/80 divide-y divide-border/50">
      {children}
    </div>
  )
}

function MenuRow({
  label,
  value,
  onClick,
}: {
  label: string
  value?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-[17px] hover:bg-subtle/50 active:bg-subtle transition-colors group"
    >
      <span className="text-[15px] font-medium text-ink">{label}</span>
      <div className="flex items-center gap-2.5 shrink-0">
        {value && <span className="text-sm text-muted">{value}</span>}
        <svg
          width="6" height="10" viewBox="0 0 6 10" fill="none"
          className="text-border/80 group-hover:text-muted transition-colors"
          aria-hidden="true"
        >
          <path d="M1 1l4 4L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  )
}

function MenuLabel({ title }: { title: string }) {
  return (
    <p className="text-[11px] font-medium text-muted/80 uppercase tracking-widest px-1 pt-8 pb-2">
      {title}
    </p>
  )
}

// ─── Sub-page primitives ──────────────────────────────────────────────────────

function SubBack({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors w-fit"
    >
      <svg width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden="true">
        <path d="M7 1L1 6.5 7 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Settings
    </button>
  )
}

function SubHead({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-2 mb-7">
      <SubBack onBack={onBack} />
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
    </div>
  )
}

function SettingCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border/80 px-5 py-4 flex flex-col gap-5">
      {children}
    </div>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-0.5 flex-1">
        <span className="text-sm font-medium text-ink">{label}</span>
        {description && <span className="text-xs text-secondary leading-relaxed">{description}</span>}
      </div>
      <div className="shrink-0 mt-0.5">{children}</div>
    </div>
  )
}

function SaveBar({ loading, saved, error }: { loading: boolean; saved: boolean; error: string | null }) {
  return (
    <div className="flex items-center gap-3 pt-3">
      <Button type="submit" loading={loading}>Save changes</Button>
      {saved  && <span className="text-sm text-accent font-medium">Saved</span>}
      {error  && <span className="text-sm text-rose-600">{error}</span>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SettingsForm({ tenant, slotSessionTypes = [], resources: initialResources = [] }: Props) {
  const [view, setView]         = useState<View>('menu')
  const [slideKey, setSlideKey] = useState(0)
  const [slideDir, setSlideDir] = useState<'right' | 'left' | null>(null)

  function goTo(next: View) {
    setSlideDir(next === 'menu' ? 'left' : 'right')
    setView(next)
    setSlideKey(k => k + 1)
  }

  const animClass = slideDir === 'right' ? 'animate-slide-in-right' : slideDir === 'left' ? 'animate-slide-in-left' : ''

  const [name, setName]               = useState(tenant.name)
  const [email, setEmail]             = useState(tenant.email)
  const [phone, setPhone]             = useState(tenant.phone)
  const [address, setAddress]         = useState(tenant.address)
  const [description, setDescription] = useState(tenant.description)
  const [logoUrl, setLogoUrl]         = useState(tenant.logoUrl ?? '')
  const [autoConfirm, setAutoConfirm] = useState(tenant.autoConfirm)
  const [sessionTypes, setSessionTypes] = useState<string[]>(
    tenant.sessionTypes?.length ? tenant.sessionTypes : slotSessionTypes
  )
  const [questions, setQuestions] = useState<IntakeQuestion[]>(tenant.intakeQuestions ?? [])

  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [savingQ, setSavingQ] = useState(false)
  const [savedQ, setSavedQ]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [resources, setResources]     = useState<Resource[]>(initialResources)
  const [resNames, setResNames]       = useState<Record<string, string>>({ staff: '', location: '', resource: '' })
  const [resAdding, setResAdding]     = useState<string | null>(null)
  const [resError, setResError]       = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true); setSaved(false); setError(null)
    try {
      await updateTenantAction(tenant.id, {
        name, email, phone, address, description,
        logoUrl: logoUrl || undefined,
        primaryColor: tenant.branding.primaryColor,
        accentColor:  tenant.branding.accentColor,
        autoConfirm,
        sessionTypes,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveQuestions() {
    setSavingQ(true); setSavedQ(false)
    const res = await saveIntakeQuestionsAction(tenant.id, questions)
    if (!res.error) { setSavedQ(true); setTimeout(() => setSavedQ(false), 3000) }
    setSavingQ(false)
  }

  async function handleAddResource(type: 'staff' | 'location' | 'resource') {
    const trimmed = resNames[type].trim()
    if (!trimmed) return
    setResAdding(type); setResError(null)
    const result = await createResourceAction(tenant.id, trimmed, type)
    setResAdding(null)
    if (result.error) { setResError(result.error); return }
    setResources(prev => [...prev, { id: result.resourceId!, tenantId: tenant.id, name: trimmed, type }])
    setResNames(prev => ({ ...prev, [type]: '' }))
  }

  async function handleDeleteResource(id: string) {
    const result = await deleteResourceAction(id)
    if (result.error) { setResError(result.error); return }
    setResources(prev => prev.filter(r => r.id !== id))
  }

  // Value previews for menu rows
  const paymentPreview = tenant.paymentMode === 'none' ? 'Off'
    : tenant.paymentMode === 'full' ? 'Full payment'
    : 'Deposit'
  const questionPreview = questions.length > 0 ? String(questions.length) : undefined

  // ── MENU ──
  if (view === 'menu') {
    return (
      <div key={slideKey} className={`flex flex-col max-w-xl ${animClass}`}>
        <h1 className="text-2xl font-semibold text-ink mb-7">Settings</h1>

        <div className="flex flex-col gap-3">
          <MenuGroup><MenuRow label="Business info" onClick={() => goTo('business')} /></MenuGroup>
          <MenuGroup><MenuRow label="Services & resources" onClick={() => goTo('services')} /></MenuGroup>
        </div>

        <MenuLabel title="Booking page" />
        <div className="flex flex-col gap-3">
          <MenuGroup><MenuRow label="Appearance" onClick={() => goTo('booking')} /></MenuGroup>
          <MenuGroup><MenuRow label="Intake questions" value={questionPreview} onClick={() => goTo('questions')} /></MenuGroup>
        </div>

        <MenuLabel title="Payments" />
        <MenuGroup><MenuRow label="Payment settings" value={paymentPreview} onClick={() => goTo('payments')} /></MenuGroup>
      </div>
    )
  }

  // ── BUSINESS INFO ──
  if (view === 'business') {
    return (
      <form key={slideKey} onSubmit={handleSave} className={`flex flex-col gap-4 max-w-xl ${animClass}`}>
        <SubHead title="Business info" onBack={() => goTo('menu')} />

        <SettingCard>
          <Input label="Business name" value={name} onChange={e => setName(e.target.value)} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-secondary">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="What customers can expect when they book with you…"
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label="Phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <Input label="Address" value={address} onChange={e => setAddress(e.target.value)} />
        </SettingCard>

        <SettingCard>
          <SettingRow
            label="Auto-confirm bookings"
            description={autoConfirm
              ? 'New bookings are confirmed instantly and the customer is notified straight away.'
              : 'New bookings are held as pending. Confirm each one from the Today view.'}
          >
            <button
              type="button"
              role="switch"
              aria-checked={autoConfirm}
              onClick={() => setAutoConfirm(v => !v)}
              className={['relative h-6 w-11 rounded-full transition-colors', autoConfirm ? 'bg-accent' : 'bg-border'].join(' ')}
            >
              <span className={['absolute top-0.5 left-0.5 h-5 w-5 bg-white shadow rounded-full transition-transform', autoConfirm ? 'translate-x-5' : 'translate-x-0'].join(' ')} />
            </button>
          </SettingRow>
        </SettingCard>

        <SettingCard>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-secondary">Tenant ID</span>
            <span className="font-mono text-xs text-muted break-all">{tenant.id}</span>
          </div>
        </SettingCard>

        <SaveBar loading={saving} saved={saved} error={error} />
      </form>
    )
  }

  // ── SERVICES & RESOURCES ──
  if (view === 'services') {
    return (
      <form key={slideKey} onSubmit={handleSave} className={`flex flex-col gap-4 max-w-xl ${animClass}`}>
        <SubHead title="Services & resources" onBack={() => goTo('menu')} />

        <SettingCard>
          <div>
            <p className="text-sm font-medium text-ink">Service types</p>
            <p className="text-xs text-secondary mt-0.5">Customers can filter by these on your booking page.</p>
          </div>
          <SessionTypeEditor types={sessionTypes} onChange={setSessionTypes} suggestions={slotSessionTypes} />
        </SettingCard>

        <div className="pt-1">
          <p className="text-sm font-medium text-ink">Resources</p>
          <p className="text-xs text-secondary mt-0.5 mb-3">Staff, locations, and equipment assigned to bookings.</p>

          {resError && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-md mb-3">{resError}</p>
          )}

          <div className="flex flex-col gap-3">
            {(
              [
                { type: 'staff',    label: 'Staff',     placeholder: 'e.g. John Smith, Sarah Jones' },
                { type: 'location', label: 'Locations',  placeholder: 'e.g. Studio A, Court 1' },
                { type: 'resource', label: 'Equipment',  placeholder: 'e.g. Bike 1, Camera Kit' },
              ] as const
            ).map(({ type, label, placeholder }) => {
              const items = resources.filter(r => r.type === type)
              return (
                <SettingCard key={type}>
                  <p className="text-sm font-medium text-ink">{label}</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={resNames[type]}
                      onChange={e => setResNames(p => ({ ...p, [type]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddResource(type))}
                      placeholder={placeholder}
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddResource(type)}
                      disabled={resAdding === type || !resNames[type].trim()}
                      className="shrink-0 bg-ink text-white px-4 py-2.5 text-sm font-medium rounded-md hover:bg-ink/85 transition-colors disabled:opacity-50"
                    >
                      {resAdding === type ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                  {items.length > 0 ? (
                    <ul className="flex flex-col divide-y divide-border/50 -mt-1">
                      {items.map(r => (
                        <li key={r.id} className="flex items-center justify-between py-3 gap-3">
                          <p className="text-sm text-ink truncate">{r.name}</p>
                          {confirmDeleteId === r.id ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-secondary">Remove?</span>
                              <button type="button" onClick={() => { handleDeleteResource(r.id); setConfirmDeleteId(null) }} className="text-xs font-semibold text-rose-600 px-1">Yes</button>
                              <button type="button" onClick={() => setConfirmDeleteId(null)} className="text-xs text-secondary px-1">No</button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => setConfirmDeleteId(r.id)} className="text-xs text-secondary hover:text-rose-500 transition-colors px-2 py-1">
                              Remove
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted">None added yet.</p>
                  )}
                </SettingCard>
              )
            })}
          </div>
        </div>

        <SaveBar loading={saving} saved={saved} error={error} />
      </form>
    )
  }

  // ── APPEARANCE ──
  if (view === 'booking') {
    return (
      <form key={slideKey} onSubmit={handleSave} className={`flex flex-col gap-4 max-w-xl ${animClass}`}>
        <SubHead title="Appearance" onBack={() => goTo('menu')} />

        <SettingCard>
          <div>
            <p className="text-sm font-medium text-ink">Logo</p>
            <p className="text-xs text-secondary mt-0.5">Shown at the top of your public booking page.</p>
          </div>
          <LogoUpload currentUrl={logoUrl || undefined} onUpload={setLogoUrl} />
        </SettingCard>

        <SettingCard>
          <BookingPageLink slug={tenant.slug} variant="full" />
        </SettingCard>

        <SaveBar loading={saving} saved={saved} error={error} />
      </form>
    )
  }

  // ── INTAKE QUESTIONS ──
  if (view === 'questions') {
    return (
      <div key={slideKey} className={`flex flex-col gap-4 max-w-xl ${animClass}`}>
        <SubHead title="Intake questions" onBack={() => goTo('menu')} />

        <p className="text-xs text-secondary -mt-2">Customers answer these before confirming their booking.</p>

        <IntakeBuilder questions={questions} onChange={setQuestions} />

        <div className="flex items-center gap-3 pt-1">
          <Button type="button" onClick={handleSaveQuestions} loading={savingQ}>
            Save questions
          </Button>
          {savedQ && <span className="text-sm text-accent font-medium">Saved</span>}
        </div>
      </div>
    )
  }

  // ── PAYMENTS ──
  if (view === 'payments') {
    return (
      <div key={slideKey} className={`flex flex-col gap-4 max-w-xl ${animClass}`}>
        <SubHead title="Payment settings" onBack={() => goTo('menu')} />
        <PaymentSettings tenant={tenant} sessionTypes={sessionTypes} />
      </div>
    )
  }

  return null
}
