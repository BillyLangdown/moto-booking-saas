'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/dashboard/bookings',
    label: 'Bookings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2" y="4" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M6 2v4M12 2v4M2 8h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/availability',
    label: 'Availability',
    icon: (
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.41 1.41M13.37 13.37l1.41 1.41M3.22 14.78l1.41-1.41M13.37 4.63l1.41-1.41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden shrink-0 flex border-t border-border bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {NAV.map(({ href, label, icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={[
              'flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors',
              active ? 'text-ink' : 'text-muted',
            ].join(' ')}
          >
            {icon}
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
