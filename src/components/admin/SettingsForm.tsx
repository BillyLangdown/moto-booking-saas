'use client'

import { useState, FormEvent } from 'react'
import type { IntakeQuestion, Tenant, UpdateTenantInput } from '@/types'
import { updateTenantAction, saveIntakeQuestionsAction } from '@/app/actions'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import LogoUpload from './LogoUpload'
import IntakeBuilder from './IntakeBuilder'
import SessionTypeEditor from './SessionTypeEditor'

interface Props { tenant: Tenant; slotSessionTypes?: string[] }

const TABS = ['Business', 'Bookings', 'Branding', 'Questions'] as const
type Tab = typeof TABS[number]

const inputClass = 'w-full bg-white border border-border px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink/20 transition'

export default function SettingsForm({ tenant, slotSessionTypes = [] }: Props) {
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
