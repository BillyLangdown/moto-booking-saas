'use client'

import { useState, FormEvent } from 'react'
import { signInAction } from './actions'

export default function LoginPage() {
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await signInAction(new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
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
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/50">Password</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition"
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
        </div>

      </div>
    </div>
  )
}
