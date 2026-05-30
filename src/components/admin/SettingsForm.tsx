'use client'

import { useState, FormEvent } from 'react'
import type { IntakeQuestion, Tenant, UpdateTenantInput } from '@/types'
import { updateTenantAction, saveIntakeQuestionsAction } from '@/app/actions'
import { getTheme, THEMES } from '@/lib/themes'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import ThemePicker from './ThemePicker'
import LogoUpload from './LogoUpload'
import IntakeBuilder from './IntakeBuilder'

interface Props { tenant: Tenant }

const labelClass = 'text-xs font-semibold uppercase tracking-wide text-secondary'
const sectionClass = 'rounded-xl border border-border bg-white divide-y divide-border'

export default function SettingsForm({ tenant }: Props) {
  const resolved = getTheme(tenant.theme)

  const [name, setName]               = useState(tenant.name)
  const [email, setEmail]             = useState(tenant.email)
  const [phone, setPhone]             = useState(tenant.phone)
  const [address, setAddress]         = useState(tenant.address)
  const [description, setDescription] = useState(tenant.description)
  const [logoUrl, setLogoUrl]         = useState(tenant.logoUrl ?? '')
  const [themeId, setThemeId]         = useState(tenant.theme ?? THEMES[0].id)
  const [questions, setQuestions]     = useState<IntakeQuestion[]>(tenant.intakeQuestions ?? [])
  const [autoConfirm, setAutoConfirm] = useState(tenant.autoConfirm !== false)

  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [savingQ, setSavingQ]     = useState(false)
  const [savedQ, setSavedQ]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true); setSaved(false); setError(null)
    const theme = getTheme(themeId)
    const input: UpdateTenantInput = {
      name, email, phone, address, description,
      logoUrl: logoUrl || undefined,
      theme: themeId,
      primaryColor: theme.primaryColor,
      accentColor:  theme.accentColor,
      autoConfirm,
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
    <div className="flex flex-col gap-8 max-w-2xl">

      {/* Business info */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink">Business info</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className={sectionClass}>
            <div className="p-5 flex flex-col gap-4">
              <Input label="Business name" value={name} onChange={(e) => setName(e.target.value)} required />
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What customers can expect when they book with you…"
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent transition resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>

          {/* Booking behaviour */}
          <h2 className="text-sm font-semibold text-ink -mb-2">Bookings</h2>
          <div className={sectionClass}>
            <div className="p-5">
              <label className="flex items-start justify-between gap-4 cursor-pointer">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-ink">Auto-confirm bookings</span>
                  <span className="text-xs text-secondary">
                    {autoConfirm
                      ? 'Bookings are confirmed instantly and the customer gets a confirmation email immediately.'
                      : 'Bookings are held as pending. You confirm each one manually — then the customer gets their email.'}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoConfirm}
                  onClick={() => setAutoConfirm(v => !v)}
                  className={[
                    'relative shrink-0 mt-0.5 h-6 w-11 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    autoConfirm ? 'bg-accent' : 'bg-border',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                      autoConfirm ? 'translate-x-5' : 'translate-x-0',
                    ].join(' ')}
                  />
                </button>
              </label>
            </div>
          </div>

          {/* Branding */}
          <h2 className="text-sm font-semibold text-ink -mb-2">Branding</h2>
          <div className={sectionClass}>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Logo</label>
                <LogoUpload currentUrl={logoUrl || undefined} onUpload={setLogoUrl} />
              </div>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <label className={labelClass}>Theme</label>
              <ThemePicker value={themeId} onChange={setThemeId} />
              <div className="mt-1 flex items-center gap-2 rounded-lg bg-subtle px-3 py-2">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: getTheme(themeId).primaryColor }} />
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: getTheme(themeId).accentColor }} />
                <span className="text-xs text-secondary">Preview — {getTheme(themeId).name}</span>
              </div>
            </div>
          </div>

          {/* Read-only */}
          <div className="rounded-xl border border-border bg-white p-5 flex flex-col gap-2">
            <p className={`${labelClass} mb-1`}>Read only</p>
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Booking URL</span>
              <span className="font-mono text-xs text-ink">/book/{tenant.slug}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Tenant ID</span>
              <span className="font-mono text-xs text-secondary">{tenant.id}</span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-rose-600 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2">{error}</p>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving}>Save changes</Button>
            {saved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
          </div>
        </form>
      </section>

      {/* Intake questions */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Booking questions</h2>
          <p className="text-xs text-secondary mt-0.5">
            Customers answer these before confirming a booking. Use them to collect any info you need upfront.
          </p>
        </div>
        <IntakeBuilder questions={questions} onChange={setQuestions} />
        <div className="flex items-center gap-3">
          <Button type="button" onClick={handleSaveQuestions} loading={savingQ}>Save questions</Button>
          {savedQ && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
        </div>
      </section>

    </div>
  )
}
