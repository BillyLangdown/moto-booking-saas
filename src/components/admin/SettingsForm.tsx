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

const inputClass = 'w-full bg-white border border-border px-3 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink/20 transition'

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
  const [questions, setQuestions] = useState<IntakeQuestion[]>(tenant.intakeQuestions ?? [])

  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [savingQ, setSavingQ] = useState(false)
  const [savedQ, setSavedQ]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [resources, setResources] = useState<Resource[]>(initialResources)
  const [resName, setResName]     = useState('')
  const [resType, setResType]     = useState<'person' | 'asset'>('person')
  const [resAdding, setResAdding] = useState(false)
  const [resError, setResError]   = useState<string | null>(null)

  async function handleAddResource() {
    const trimmed = resName.trim()
    if (!trimmed) return
    setResAdding(true); setResError(null)
    const result = await createResourceAction(tenant.id, trimmed, resType)
    setResAdding(false)
    if (result.error) { setResError(result.error); return }
    setResources((prev) => [...prev, { id: result.resourceId!, tenantId: tenant.id, name: trimmed, type: resType }])
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

  const SaveBar = ({ loading }: { loading: boolean }) => (
    <div className="flex items-center gap-3 pt-1">
      <Button type="submit" loading={loading} className="flex-1 sm:flex-none justify-center">Save changes</Button>
      {saved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
      {error && <span className="text-sm text-rose-600">{error}</span>}
    </div>
  )

  return (
    <div className="flex flex-col gap-5">

      {/* Tab nav — scrollable on mobile, no visible scrollbar */}
      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b border-border">
        <div className="flex min-w-max">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={[
                'relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                tab === t ? 'text-ink' : 'text-secondary hover:text-ink',
              ].join(' ')}
            >
              {t}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Business ── */}
      {tab === 'Business' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white shadow-sm p-4 sm:p-5 flex flex-col gap-4">
            <Input label="Business name" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-secondary">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What customers can expect when they book with you…"
                className={`${inputClass} resize-none`}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="bg-white shadow-sm p-4 sm:p-5 flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary mb-1">Read only</p>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-secondary">Booking URL</span>
              <span className="font-mono text-xs text-ink break-all">/book/{tenant.slug}</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
              <span className="text-xs text-secondary">Tenant ID</span>
              <span className="font-mono text-xs text-muted break-all">{tenant.id}</span>
            </div>
          </div>

          <SaveBar loading={saving} />
        </form>
      )}

      {/* ── Bookings ── */}
      {tab === 'Bookings' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white shadow-sm p-4 sm:p-5">
            <label className="flex items-start justify-between gap-4 cursor-pointer">
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-sm font-medium text-ink">Auto-confirm bookings</span>
                <span className="text-xs text-secondary leading-relaxed">
                  {autoConfirm
                    ? 'Bookings are confirmed instantly and the customer is emailed immediately.'
                    : 'Bookings are held as pending. You confirm each one from the Bookings page, then the customer is notified.'}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoConfirm}
                onClick={() => setAutoConfirm((v) => !v)}
                className={['relative shrink-0 mt-0.5 h-6 w-11 transition-colors focus:outline-none', autoConfirm ? 'bg-ink' : 'bg-border'].join(' ')}
              >
                <span className={['absolute top-0.5 left-0.5 h-5 w-5 bg-white shadow transition-transform', autoConfirm ? 'translate-x-5' : 'translate-x-0'].join(' ')} />
              </button>
            </label>
          </div>
          <SaveBar loading={saving} />
        </form>
      )}

      {/* ── Services ── */}
      {tab === 'Services' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white shadow-sm p-4 sm:p-5 flex flex-col gap-3">
            <div>
              <p className="text-sm font-medium text-ink">Services</p>
              <p className="text-xs text-secondary mt-0.5">
                The services you offer. Customers can filter by these on your booking page.
              </p>
            </div>
            <SessionTypeEditor types={sessionTypes} onChange={setSessionTypes} suggestions={slotSessionTypes} />
          </div>
          <SaveBar loading={saving} />
        </form>
      )}

      {/* ── Resources ── */}
      {tab === 'Resources' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white shadow-sm p-4 sm:p-5 flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-ink">Resources</p>
              <p className="text-xs text-secondary mt-0.5">
                The people or things customers book — a staff member, vehicle, room, or equipment. Each slot is linked to one resource.
              </p>
            </div>

            {/* Add form */}
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={resName}
                onChange={(e) => setResName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddResource())}
                placeholder="e.g. John Smith, Bike 1, Room A"
                className={inputClass}
              />
              <select
                value={resType}
                onChange={(e) => setResType(e.target.value as 'person' | 'asset')}
                className="w-full border border-border bg-white px-3 py-3 text-sm text-ink focus:outline-none"
              >
                <option value="person">Person</option>
                <option value="asset">Asset (vehicle, room...)</option>
              </select>
              <button
                type="button"
                onClick={handleAddResource}
                disabled={resAdding || !resName.trim()}
                className="w-full bg-ink text-white py-3 text-sm font-medium hover:bg-ink/85 transition-colors disabled:opacity-50"
              >
                {resAdding ? 'Adding…' : 'Add resource'}
              </button>
            </div>

            {/* List */}
            {resources.length > 0 ? (
              <ul className="flex flex-col divide-y divide-border/50">
                {resources.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-subtle border border-border">
                        {r.type === 'person' ? (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                            <circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
                            <path d="M2 12.5c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                            <rect x="1" y="4" width="12" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
                            <path d="M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.3"/>
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{r.name}</p>
                        <p className="text-xs text-secondary">{r.type === 'person' ? 'Person' : 'Asset'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteResource(r.id)}
                      className="shrink-0 text-xs text-secondary hover:text-rose-500 transition-colors px-2 py-1"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-secondary text-center py-8 border border-dashed border-border">
                No resources yet — add your first one above.
              </p>
            )}

            {resError && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2">{resError}</p>}
          </div>

          <p className="text-xs text-secondary px-1">
            Tip: add one resource per staff member or piece of equipment so bookings spread across them correctly.
          </p>
        </div>
      )}

      {/* ── Branding ── */}
      {tab === 'Branding' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white shadow-sm p-4 sm:p-5 flex flex-col gap-3">
            <div>
              <p className="text-sm font-medium text-ink">Logo</p>
              <p className="text-xs text-secondary mt-0.5">Shown at the top of your booking page.</p>
            </div>
            <LogoUpload currentUrl={logoUrl || undefined} onUpload={setLogoUrl} />
          </div>
          <SaveBar loading={saving} />
        </form>
      )}

      {/* ── Questions ── */}
      {tab === 'Questions' && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-secondary">
            Customers answer these before confirming their booking. Collect anything you need upfront.
          </p>
          <IntakeBuilder questions={questions} onChange={setQuestions} />
          <div className="flex items-center gap-3 pt-1">
            <Button type="button" onClick={handleSaveQuestions} loading={savingQ} className="flex-1 sm:flex-none justify-center">
              Save questions
            </Button>
            {savedQ && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
          </div>
        </div>
      )}

    </div>
  )
}
