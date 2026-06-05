'use client'

import { useState } from 'react'
import type { PaymentMode, SessionTypePrices, Tenant } from '@/types'
import { savePaymentSettingsAction } from '@/app/actions'
import Button from '@/components/ui/Button'
import StripeConnect from './StripeConnect'

interface Props {
  tenant:       Tenant
  sessionTypes: string[]
}

const CURRENCY_SYMBOL: Record<string, string> = { gbp: '£', usd: '$', eur: '€' }

function initRaw(sessionTypes: string[], prices: SessionTypePrices) {
  const raw: Record<string, string> = {}
  for (const type of sessionTypes) {
    const p = prices[type]
    raw[`${type}:price`]         = p?.price         ? (p.price / 100).toFixed(2)         : ''
    raw[`${type}:depositAmount`] = p?.depositAmount ? (p.depositAmount / 100).toFixed(2) : ''
  }
  return raw
}

export default function PaymentSettings({ tenant, sessionTypes }: Props) {
  const symbol = CURRENCY_SYMBOL[tenant.currency] ?? '£'

  const [paymentMode, setPaymentMode]               = useState<PaymentMode>(tenant.paymentMode)
  const [prices, setPrices]                         = useState<SessionTypePrices>(tenant.sessionTypePrices ?? {})
  const [showPrices, setShowPrices]                 = useState(tenant.showPricesOnBookingPage ?? true)
  const [rawInputs, setRawInputs]                   = useState<Record<string, string>>(
    () => initRaw(sessionTypes, tenant.sessionTypePrices ?? {})
  )
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function handleRawChange(type: string, field: 'price' | 'depositAmount', value: string) {
    setRawInputs(prev => ({ ...prev, [`${type}:${field}`]: value }))
  }

  function commitPrice(type: string, field: 'price' | 'depositAmount', value: string) {
    const pence = Math.round(parseFloat(value) * 100)
    const safe  = isNaN(pence) || pence < 0 ? 0 : pence
    setPrices(prev => ({
      ...prev,
      [type]: {
        price:         prev[type]?.price         ?? 0,
        depositAmount: prev[type]?.depositAmount ?? 0,
        [field]: safe,
      },
    }))
    setRawInputs(prev => ({ ...prev, [`${type}:${field}`]: safe ? (safe / 100).toFixed(2) : '' }))
  }

  async function handleSave() {
    setSaving(true); setSaved(false); setError(null)
    const res = await savePaymentSettingsAction(tenant.id, {
      paymentMode,
      sessionTypePrices: prices,
      showPricesOnBookingPage: showPrices,
    })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  const needsPayment    = paymentMode !== 'none'
  const stripeReady     = needsPayment && !!tenant.stripeOnboarded
  const showPriceInputs = stripeReady && sessionTypes.length > 0

  return (
    <div className="flex flex-col gap-4">

      {/* Payment mode */}
      <div className="bg-white shadow-sm p-4 sm:p-5 flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Payment mode</p>
          <p className="text-xs text-secondary mt-0.5">Choose how customers pay when they book.</p>
        </div>
        <div className="flex flex-col gap-2">
          {([
            { value: 'none',    label: 'No payment',   desc: 'Bookings are free. No card required.' },
            { value: 'full',    label: 'Full payment',  desc: 'Customers pay the full amount when booking.' },
            { value: 'deposit', label: 'Deposit',       desc: 'Customers pay a deposit now and the remainder later.' },
          ] as { value: PaymentMode; label: string; desc: string }[]).map(({ value, label, desc }) => (
            <label
              key={value}
              className={[
                'flex items-start gap-3 p-3 border cursor-pointer transition-colors',
                paymentMode === value ? 'border-ink bg-ink/[0.03]' : 'border-border hover:bg-gray-50',
              ].join(' ')}
            >
              <input
                type="radio"
                name="paymentMode"
                value={value}
                checked={paymentMode === value}
                onChange={() => setPaymentMode(value)}
                className="mt-0.5 shrink-0 accent-ink"
              />
              <div>
                <p className="text-sm font-medium text-ink">{label}</p>
                <p className="text-xs text-secondary mt-0.5">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Stripe Connect - only needed when taking payments */}
      {needsPayment && (
        <StripeConnect tenant={tenant} />
      )}

      {/* Show prices on booking page toggle */}
      {stripeReady && (
        <div className="bg-white shadow-sm p-4 sm:p-5">
          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-sm font-medium text-ink">Show prices on booking page</span>
              <span className="text-xs text-secondary leading-relaxed">
                Customers will see the {paymentMode === 'deposit' ? 'deposit amount and full price' : 'price'} on each slot before booking.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showPrices}
              onClick={() => setShowPrices(v => !v)}
              className={['relative shrink-0 mt-0.5 h-6 w-11 transition-colors focus:outline-none', showPrices ? 'bg-ink' : 'bg-border'].join(' ')}
            >
              <span className={['absolute top-0.5 left-0.5 h-5 w-5 bg-white shadow transition-transform', showPrices ? 'translate-x-5' : 'translate-x-0'].join(' ')} />
            </button>
          </label>
        </div>
      )}

      {/* Prices per session type */}
      {showPriceInputs && (
        <div className="bg-white shadow-sm p-4 sm:p-5 flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Pricing by service</p>
            <p className="text-xs text-secondary mt-0.5">
              {paymentMode === 'deposit'
                ? 'Set the deposit and full price for each service.'
                : 'Set the price for each service. Leave blank to make it free.'}
            </p>
          </div>

          <div className="flex flex-col divide-y divide-border/50">
            {sessionTypes.map(type => (
              <div key={type} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-ink pt-1.5">{type}</p>

                {paymentMode === 'full' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-sm text-secondary">{symbol}</span>
                    <input
                      type="number" min="0" step="0.01" placeholder="0.00"
                      value={rawInputs[`${type}:price`] ?? ''}
                      onChange={e => handleRawChange(type, 'price', e.target.value)}
                      onBlur={e => commitPrice(type, 'price', e.target.value)}
                      className="w-28 border border-border bg-white px-2 py-1.5 text-sm text-ink text-right focus:outline-none focus:ring-2 focus:ring-ink/20"
                    />
                  </div>
                )}

                {paymentMode === 'deposit' && (
                  <div className="flex flex-col gap-2 shrink-0 items-end">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-secondary">Full</span>
                      <span className="text-sm text-secondary">{symbol}</span>
                      <input
                        type="number" min="0" step="0.01" placeholder="0.00"
                        value={rawInputs[`${type}:price`] ?? ''}
                        onChange={e => handleRawChange(type, 'price', e.target.value)}
                        onBlur={e => commitPrice(type, 'price', e.target.value)}
                        className="w-28 border border-border bg-white px-2 py-1.5 text-sm text-ink text-right focus:outline-none focus:ring-2 focus:ring-ink/20"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-secondary">Deposit</span>
                      <span className="text-sm text-secondary">{symbol}</span>
                      <input
                        type="number" min="0" step="0.01" placeholder="0.00"
                        value={rawInputs[`${type}:depositAmount`] ?? ''}
                        onChange={e => handleRawChange(type, 'depositAmount', e.target.value)}
                        onBlur={e => commitPrice(type, 'depositAmount', e.target.value)}
                        className="w-28 border border-border bg-white px-2 py-1.5 text-sm text-ink text-right focus:outline-none focus:ring-2 focus:ring-ink/20"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="button" onClick={handleSave} loading={saving} className="flex-1 sm:flex-none justify-center">
          Save payment settings
        </Button>
        {saved && <span className="text-sm text-green-600 font-medium">Saved</span>}
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>
    </div>
  )
}
