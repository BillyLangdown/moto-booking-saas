'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createBusinessAction } from '@/app/platform/actions'
import { Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const TABS = ['Business', 'Admin login'] as const
type Tab = typeof TABS[number]

const inputClass = 'w-full border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent transition'
const labelClass = 'text-xs font-semibold uppercase tracking-wide text-secondary'

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function NewBusinessForm() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('Business')

  const [name, setName]               = useState('')
  const [slug, setSlug]               = useState('')
  const [email, setEmail]             = useState('')
  const [phone, setPhone]             = useState('')
  const [address, setAddress]         = useState('')
  const [description, setDescription] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]             = useState<string | null>(null)

  function handleNameChange(v: string) {
    setName(v)
    setSlug(slugify(v))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await createBusinessAction({
      name, slug, email, phone, address, description,
      theme: 'default',
      primaryColor: '#0f172a',
      accentColor: '#6366f1',
      adminEmail,
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

      {/* Tab nav */}
      <div className="flex border-b border-border">
        {TABS.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-colors relative',
              tab === t ? 'text-ink' : 'text-secondary hover:text-ink',
            ].join(' ')}
          >
            {t}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />}
          </button>
        ))}
      </div>

      {/* Business tab */}
      {tab === 'Business' && (
        <div className="bg-white shadow-sm p-5 flex flex-col gap-4">
          <Input
            label="Business name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="City Yoga Studio"
          />
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Booking page address</label>
            <input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              required
              placeholder="city-yoga-studio"
              className={inputClass}
            />
            {slug && <p className="text-xs text-secondary">Your booking page: /book/{slug}</p>}
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
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      )}

      {/* Admin login tab */}
      {tab === 'Admin login' && (
        <div className="bg-white shadow-sm p-5 flex flex-col gap-4">
          <p className="text-xs text-secondary">
            An invite email will be sent to this address. The owner clicks the link and sets their own password during onboarding.
          </p>
          <Input label="Admin email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required placeholder="owner@business.com" autoComplete="off" />
        </div>
      )}

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2.5">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={submitting}>Create business</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>

    </form>
  )
}
