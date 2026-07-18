'use client'

import { useState, FormEvent } from 'react'
import { signInAction, requestPasswordResetAction } from './actions'

type Mode = 'signin' | 'forgot' | 'sent'

const inputClass = 'w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition'

export default function LoginPage() {
  const [mode, setMode]       = useState<Mode>('signin')
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await signInAction(new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  async function handleForgotSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    await requestPasswordResetAction(resetEmail)
    setLoading(false)
    setMode('sent')
  }

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center p-4"
      style={{ background: '#0B1120' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <img src="/images/orla_booking_logo_light.png" alt="Orla" className="h-8 w-auto object-contain" />
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 p-8 rounded-[10px]">

          {mode === 'signin' && (
            <>
              <h1 className="text-lg font-semibold text-white mb-1">Sign in</h1>
              <p className="text-sm text-white/40 mb-7">Access your booking dashboard.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-white/50">Password</label>
                    <button
                      type="button"
                      onClick={() => { setError(null); setMode('forgot') }}
                      className="text-xs text-white/40 hover:text-white/70 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className={inputClass}
                  />
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
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <h1 className="text-lg font-semibold text-white mb-1">Reset your password</h1>
              <p className="text-sm text-white/40 mb-7">We'll email you a link to choose a new one.</p>

              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/50">Email</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-sm font-semibold text-white bg-accent hover:bg-accent-hover transition-colors disabled:opacity-50 mt-1 rounded-md"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors -mt-1"
                >
                  Back to sign in
                </button>
              </form>
            </>
          )}

          {mode === 'sent' && (
            <>
              <h1 className="text-lg font-semibold text-white mb-1">Check your email</h1>
              <p className="text-sm text-white/40 mb-7 leading-relaxed">
                If an account exists for {resetEmail || 'that address'}, we've sent a link to reset your password.
              </p>
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Back to sign in
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  )
}
