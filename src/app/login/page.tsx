'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signInAction } from './actions'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await signInAction(new FormData(e.currentTarget))
    if (result.error) { setError(result.error); setLoading(false) }
    else router.push('/dashboard/bookings')
  }

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0D1117 0%, #1a2644 50%, #0f1f3d 100%)' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="flex h-12 w-12 items-center justify-center bg-white/10 text-white text-xl font-bold backdrop-blur">
            S
          </div>
          <p className="text-sm text-white/40 tracking-widest uppercase font-medium">Slick</p>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 p-8">
          <h1 className="text-lg font-semibold text-white mb-1">Sign in</h1>
          <p className="text-sm text-white/40 mb-7">Access your booking dashboard.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition"
              />
            </div>

            {error && (
              <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50 mt-1"
              style={{ background: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
