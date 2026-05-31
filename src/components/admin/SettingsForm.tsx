'use client'

import { useState, FormEvent } from 'react'
import type { IntakeQuestion, Resource, Tenant, UpdateTenantInput } from '@/types'
import { updateTenantAction, saveIntakeQuestionsAction, createResourceAction, deleteResourceAction } from '@/app/actions'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import LogoUpload from './LogoUpload'
import IntakeBuilder from './IntakeBuilder'
import SessionTypeEditor from './SessionTypeEditor'

interface Props { tenant: Tenant; slotSessionTypes?: string[]; resources?: Resource[] }

const TABS = ['Business', 'Bookings', 'Services', 'Resources', 'Branding', 'Questions'] as const
type Tab = typeof TABS[number]

const inputClass = 'w-full bg-white border border-border px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink/20 transition'

export default function SettingsForm({ tenant, slotSessionTypes = [], resources: initialResources = [] }: Props) {
  const [tab, setTab] = useState<Tab>('Business')

  const [name, setName]               = useState(tenant.name)
  const [email, setEmail]             = useState(tenant.email)
  const [phone, setPhone]             = useState(tenant.phone)
  const [address, setAddress]         = useState(tenant.address)
  const [description, setDescription] = useState(tenant.description)
  const [logoUrl, setLogoUrl]         = useState(tenant.logoUrl ?? '')
  const [autoConfirm, setAutoConfirm]   = useState(tenant.autoConfirm !== false)
  const [sessionTypes, setSessionTypes] = useState<string[]>(
    tenant.sessionTypes?.length ? tenant.sessionTypes : slotSessionTypes
  )
  const [questions, setQuestions]       = useState<IntakeQuestion[]>(tenant.intakeQuestions ?? [])

  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [savingQ, setSavingQ] = useState(false)
  const [savedQ, setSavedQ]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Resources tab
  const [resources, setResources]   = useState<Resource[]>(initialResources)
  const [resName, setResName]       = useState('')
  const [resType, setResType]       = useState<'person' | 'asset'>('person')
  const [resAdding, setResAdding]   = useState(false)
  const [resError, setResError]     = useState<string | null>(null)

  async function handleAddResource() {
    const name = resName.trim()
    if (!name) return
    setResAdding(true); setResError(null)
    const result = await createResourceAction(tenant.id, name, resType)
    setResAdding(false)
    if (result.error) { setResError(result.error); return }
    setResources((prev) => [...prev, { id: result.resourceId!, tenantId: tenant.id, name, type: resType }])
    setResName('')
  }

  async function handleDeleteResource(id: string) {
    const result = await deleteResourceAction(id)
    if (result.error) { setResError(result.error); return }
    setResources((prev) => prev.filter((r) => r.id !== id))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true); setSaved(false); setError(null)
    const input: UpdateTenantInput = {
      name, email, phone, address, description,
      logoUrl: logoUrl || undefined,
      primaryColor: tenant.branding.primaryColor,
      accentColor:  tenant.branding.accentColor,
      autoConfirm,
      sessionTypes,
    }
    try {
      await updateTenantAction(tenant.id, input)
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

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Tab nav */}
      <div className="flex border-b border-border">
        {TABS.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-colors relative',
              tab === t
                ? 'text-ink'
                : 'text-secondary hover:text-ink',
            ].join(' ')}
          >
            {t}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />}
          </button>
        ))}
      </div>

      {/* Business */}
      {tab === 'Business' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white shadow-sm p-5 flex flex-col gap-4">
            <Input label="Business name" value={name} onChange={e => setName(e.target.value)} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-secondary">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="What customers can expect when they book with you…"
                className={`${inputClass} resize-none`}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <Input label="Phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <Input label="Address" value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          <div className="bg-white shadow-sm p-5 flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary mb-1">Read only</p>
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Booking URL</span>
              <span className="font-mono text-xs text-ink">/book/{tenant.slug}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Tenant ID</span>
              <span className="font-mono text-xs text-secondary">{tenant.id}</span>
            </div>
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 px-4 py-3">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving}>Save changes</Button>
            {saved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
          </div>
        </form>
      )}

      {/* Bookings */}
      {tab === 'Bookings' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white shadow-sm p-5">
            <label className="flex items-start justify-between gap-4 cursor-pointer">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-ink">Auto-confirm bookings</span>
                <span className="text-xs text-secondary leading-relaxed">
                  {autoConfirm
                    ? 'Bookings are confirmed instantly. Customer gets their confirmation email immediately.'
                    : 'Bookings are held as pending. You confirm each one from the Bookings page — then the customer is notified.'}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoConfirm}
                onClick={() => setAutoConfirm(v => !v)}
                className={['relative shrink-0 mt-0.5 h-6 w-11 transition-colors focus:outline-none', autoConfirm ? 'bg-ink' : 'bg-border'].join(' ')}
              >
                <span className={['absolute top-0.5 left-0.5 h-5 w-5 bg-white shadow transition-transform', autoConfirm ? 'translate-x-5' : 'translate-x-0'].join(' ')} />
              </button>
            </label>
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 px-4 py-3">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving}>Save changes</Button>
            {saved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
          </div>
        </form>
      )}

      {/* Services */}
      {tab === 'Services' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white shadow-sm p-5 flex flex-col gap-3">
            <div>
              <p className="text-sm font-medium text-ink">Services</p>
              <p className="text-xs text-secondary mt-0.5">
                The services you offer. Customers can filter by these on your booking page, and they appear as options when you add availability slots.
              </p>
            </div>
            <SessionTypeEditor types={sessionTypes} onChange={setSessionTypes} suggestions={slotSessionTypes} />
          </div>
          {error && <p className="text-sm text-rose-600 bg-rose-50 px-4 py-3">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving}>Save changes</Button>
            {saved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
          </div>
        </form>
      )}

      {/* Resources */}
      {tab === 'Resources' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white shadow-sm p-5 flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-ink">What are your resources?</p>
              <p className="text-xs text-secondary mt-0.5">
                The people or things customers book — a staff member, vehicle, room, or equipment. Each slot is linked to one resource.
              </p>
            </div>

            {/* Add form */}
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="text"
                value={resName}
                onChange={(e) => setResName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddResource())}
                placeholder="e.g. John Smith, Bike 1, Treatment Room"
                className={`${inputClass} flex-1`}
              />
              <select
                value={resType}
                onChange={(e) => setResType(e.target.value as 'person' | 'asset')}
                className="border border-border bg-white px-3 py-2.5 text-sm text-ink focus:outline-none shrink-0"
              >
                <option value="person">Person</option>
                <option value="asset">Asset</option>
              </select>
              <button
                type="button"
                onClick={handleAddResource}
                disabled={resAdding || !resName.trim()}
                className="shrink-0 bg-ink text-white px-4 py-2.5 text-sm font-medium hover:bg-ink/85 transition-colors disabled:opacity-50"
              >
                {resAdding ? 'Adding…' : 'Add'}
              </button>
            </div>

            {/* List */}
            {resources.length > 0 ? (
              <ul className="flex flex-col divide-y divide-border/50">
                {resources.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${r.type === 'person' ? 'bg-ink/8' : 'bg-ink/5'}`}>
                        {r.type === 'person' ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                            <circle cx="6" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M1.5 10.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                            <rect x="1" y="3.5" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M4 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2"/>
                          </svg>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-ink">{r.name}</span>
                        <span className="text-xs text-secondary ml-2">{r.type === 'person' ? 'Person' : 'Asset'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteResource(r.id)}
                      className="text-xs text-secondary hover:text-rose-500 transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-secondary text-center py-6 border border-dashed border-border">
                No resources yet — add your first one above.
              </p>
            )}

            {resError && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2">{resError}</p>}
          </div>

          <p className="text-xs text-secondary">
            Tip: if you have multiple staff or vehicles, add one resource per person or item so bookings can be spread across them.
          </p>
        </div>
      )}

      {/* Branding */}
      {tab === 'Branding' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white shadow-sm p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-secondary">Logo</label>
              <LogoUpload currentUrl={logoUrl || undefined} onUpload={setLogoUrl} />
            </div>
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 px-4 py-3">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving}>Save changes</Button>
            {saved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
          </div>
        </form>
      )}

      {/* Questions */}
      {tab === 'Questions' && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-secondary">
            Customers answer these before confirming their booking. Use them to collect any information you need upfront.
          </p>
          <IntakeBuilder questions={questions} onChange={setQuestions} />
          <div className="flex items-center gap-3">
            <Button type="button" onClick={handleSaveQuestions} loading={savingQ}>Save questions</Button>
            {savedQ && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
          </div>
        </div>
      )}

    </div>
  )
}
