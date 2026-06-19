'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { signOutAction } from '@/app/login/actions'

interface Props {
  open: boolean
  onClose: () => void
  tenantName: string
  tenantSlug: string
}

const NAV = [
  { href: '/dashboard/ask-orla', label: 'Ask Orla' },
  { href: '/dashboard/bookings', label: 'Bookings' },
  { href: '/dashboard/availability', label: 'Availability' },
  { href: '/dashboard/settings', label: 'Settings' },
]

export default function NavDrawer({ open, onClose, tenantName, tenantSlug }: Props) {
  const pathname = usePathname()

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Close when route changes
  useEffect(() => { onClose() }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          'fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Panel — slides down from top */}
      <div
        role="dialog"
        aria-modal="true"
        className={[
          'fixed inset-x-0 top-0 z-[70] transition-transform duration-300 ease-in-out',
          open ? 'translate-y-0' : '-translate-y-full',
        ].join(' ')}
        style={{ background: '#1F2937' }}
      >
        {/* Header row */}
        <div className="flex h-14 items-center justify-between px-5">
          <img src="/images/Orla-logo-horizontal-white.png" alt="Orla" className="h-6 w-auto object-contain" />
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white transition-colors"
            aria-label="Close navigation"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M12 3L3 12M3 3l9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Business label */}
        <div className="px-5 pb-3">
          <p className="text-white/35 text-xs truncate">{tenantName}</p>
        </div>

        {/* Nav links */}
        <nav className="px-3 pb-3 flex flex-col gap-0.5">
          {NAV.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/45 hover:text-white hover:bg-white/6',
                ].join(' ')}
              >
                {label}
                {active && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
              </Link>
            )
          })}
        </nav>

        {/* Divider + utility */}
        <div className="border-t border-white/8 px-3 pt-3 pb-5 flex flex-col gap-0.5">
          <a
            href={`/book/${tenantSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs text-white/35 hover:text-white/65 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5 2H2.5A1.5 1.5 0 001 3.5v8A1.5 1.5 0 002.5 13h8a1.5 1.5 0 001.5-1.5V9M9 1h4m0 0v4m0-4L6 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            View booking page
          </a>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-4 py-3 rounded-xl text-xs text-white/35 hover:text-rose-400 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 2H2.5A1.5 1.5 0 001 3.5v7A1.5 1.5 0 002.5 12H5M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
