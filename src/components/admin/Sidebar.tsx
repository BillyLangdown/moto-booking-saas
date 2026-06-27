'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOutAction } from '@/app/login/actions'

interface Props { tenantName: string; tenantSlug: string }

const NAV = [
  {
    href: '/dashboard/ask-orla',
    label: 'Ask Orla',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0014 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="9" y1="22" x2="15" y2="22"/></svg>,
  },
  {
    href: '/dashboard/bookings',
    label: 'Bookings',
    icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><path d="M6 2v4M12 2v4M2 8h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
  {
    href: '/dashboard/availability',
    label: 'Availability',
    icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.6"/><path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6"/><path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.41 1.41M13.37 13.37l1.41 1.41M3.22 14.78l1.41-1.41M13.37 4.63l1.41-1.41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
]

export default function Sidebar({ tenantName, tenantSlug }: Props) {
  const pathname = usePathname()

  return (
    <aside
      className="flex h-full w-56 shrink-0 flex-col"
      style={{ background: '#0B1120' }}
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-white/8">
        <img src="/images/orla_booking_logo_light.png" alt="Orla" className="h-6 w-auto object-contain" />
        <p className="text-white/40 text-xs mt-1 truncate">{tenantName}</p>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 pt-3 flex-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-md',
                active
                  ? 'bg-accent/15 text-accent'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/5',
              ].join(' ')}
            >
              {icon}
              {label}
              {active && <span className="ml-auto w-1 h-1 rounded-full bg-accent" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/8">
        <Link
          href={`/book/${tenantSlug}`}
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 text-xs text-white/35 hover:text-white/65 transition-colors rounded-md hover:bg-white/5"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M5 2H2.5A1.5 1.5 0 001 3.5v8A1.5 1.5 0 002.5 13h8a1.5 1.5 0 001.5-1.5V9M9 1h4m0 0v4m0-4L6 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          View booking page
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-white/35 hover:text-rose-400 transition-colors rounded-md hover:bg-white/5"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M5 2H2.5A1.5 1.5 0 001 3.5v7A1.5 1.5 0 002.5 12H5M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
