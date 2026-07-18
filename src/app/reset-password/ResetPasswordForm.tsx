'use client'

import { useState, FormEvent } from 'react'
import { completePasswordResetAction } from '@/app/login/actions'

const inputClass = 'w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition'

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
    <span className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-emerald-400' : 'text-white/30'}`}>
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

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const rules = passwordRules(password)
  const allRulesMet = Object.values(rules).every(Boolean)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!allRulesMet) { setError('Password does not meet all requirements.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    const result = await completePasswordResetAction(password)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center p-4"
      style={{ background: '#0B1120' }}
    >
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center gap-3 mb-10">
          <img src="/images/orla_booking_logo_light.png" alt="Orla" className="h-8 w-auto object-contain" />
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 p-8 rounded-[10px]">
          <h1 className="text-lg font-semibold text-white mb-1">Choose a new password</h1>
          <p className="text-sm text-white/40 mb-7">Make it something you haven't used here before.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/50">New password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/50">Confirm password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <RuleRow met={rules.length}  label="At least 8 characters" />
              <RuleRow met={rules.upper}   label="One uppercase letter" />
              <RuleRow met={rules.number}  label="One number" />
              <RuleRow met={rules.special} label="One special character" />
            </div>

            {error && (
              <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-md">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold text-white bg-accent hover:bg-accent-hover transition-colors disabled:opacity-50 mt-1 rounded-md"
            >
              {loading ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
