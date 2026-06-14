'use client'

import { useState } from 'react'
import type { Tenant } from '@/types'
import { disconnectStripeAction } from '@/app/actions'
import Button from '@/components/ui/Button'

interface Props { tenant: Tenant }

export default function StripeConnect({ tenant }: Props) {
  const [loading, setLoading]         = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError]             = useState<string | null>(null)

  async function handleConnect() {
    setLoading(true)
    setError(null)
    const res  = await fetch('/api/stripe/connect', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ tenantId: tenant.id }),
    })
    const json = await res.json()
    if (json.url) {
      window.location.href = json.url
    } else {
      setError(json.error ?? 'Something went wrong')
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect Stripe? Customers will no longer be able to pay online until you reconnect.')) return
    setDisconnecting(true)
    await disconnectStripeAction(tenant.id)
    setDisconnecting(false)
  }

  if (tenant.stripeOnboarded) {
    return (
      <div className="bg-white shadow-sm p-4 sm:p-5 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-sm font-semibold text-ink">Stripe</p>
          <p className="font-mono text-[11px] text-muted truncate">{tenant.stripeAccountId}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Connected
          </span>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs text-secondary hover:text-rose-500 transition-colors disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm p-4 sm:p-5 flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-ink">Connect your Stripe account</p>
        <p className="text-xs text-secondary mt-1 leading-relaxed">
          Accept card payments directly into your bank. Stripe guides you through the whole setup - no technical knowledge needed. Takes about 5 minutes.
        </p>
      </div>
      {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2">{error}</p>}
      <Button type="button" onClick={handleConnect} loading={loading} className="self-start">
        Connect Stripe →
      </Button>
    </div>
  )
}
