'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createSchoolAction } from '@/app/platform/actions'
import { getTheme, THEMES } from '@/lib/themes'
import { Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ThemePicker from '@/components/admin/ThemePicker'

const labelClass = 'text-xs font-semibold uppercase tracking-wide text-secondary'
const inputClass = 'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent transition'

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function NewSchoolForm() {
  const router = useRouter()

  const [name, setName]               = useState('')
  const [slug, setSlug]               = useState('')
  const [email, setEmail]             = useState('')
  const [phone, setPhone]             = useState('')
  const [address, setAddress]         = useState('')
  const [description, setDescription] = useState('')
  const [themeId, setThemeId]         = useState(THEMES[0].id)
  const [adminEmail, setAdminEmail]   = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)

  function handleNameChange(v: string) {
    setName(v)
    setSlug(slugify(v))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const theme = getTheme(themeId)
    const result = await createSchoolAction({
      name, slug, email, phone, address, description,
      theme:        themeId,
      primaryColor: theme.primaryColor,
      accentColor:  theme.accentColor,
      adminEmail, adminPassword,
    })
    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      router.push(`/platform/${result.tenantId}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink">Business info</h2>
        <div className="rounded-xl border border-border bg-white p-5 flex flex-col gap-4">
          <Input
            label="Business name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="Southern Moto School"
          />
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Slug <span className="normal-case font-normal text-muted">— booking URL</span></label>
            <input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              required
              placeholder="southern-moto-school"
              className={inputClass}
            />
            {slug && <p className="text-xs text-secondary">/book/{slug}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What customers can expect…"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent transition resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink">Theme</h2>
        <div className="rounded-xl border border-border bg-white p-5 flex flex-col gap-3">
          <ThemePicker value={themeId} onChange={setThemeId} />
          <div className="flex items-center gap-2 rounded-lg bg-subtle px-3 py-2 text-xs text-secondary">
            <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: getTheme(themeId).primaryColor }} />
            <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: getTheme(themeId).accentColor }} />
            {getTheme(themeId).name} — the school can change this after logging in
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink">Admin login</h2>
        <div className="rounded-xl border border-border bg-white p-5 flex flex-col gap-4">
          <p className="text-xs text-secondary -mt-1">
            Send these credentials to the business owner so they can log in and complete setup.
          </p>
          <Input label="Admin email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required placeholder="owner@business.com" />
          <Input label="Password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required placeholder="Min. 6 characters" />
        </div>
      </div>

      {error && (
        <p className="text-sm text-rose-600 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={submitting}>Create school</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>

    </form>
  )
}
