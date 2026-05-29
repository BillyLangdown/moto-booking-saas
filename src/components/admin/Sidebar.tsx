'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/dashboard/bookings',
    label: 'Bookings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2" y="4" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 2v4M12 2v4M2 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/availability',
    label: 'Availability',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.41 1.41M13.37 13.37l1.41 1.41M3.22 14.78l1.41-1.41M13.37 4.63l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-white text-xs font-bold">
          B
        </div>
        <span className="font-semibold text-ink text-sm">BookMoto</span>
        <span className="ml-auto text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
          Demo
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-subtle text-ink font-medium'
                  : 'text-secondary hover:text-ink hover:bg-subtle',
              ].join(' ')}
            >
              {icon}
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer link */}
      <div className="border-t border-border p-3">
        <Link
          href="/book/southern-moto-school"
          className="flex items-center gap-2 text-xs text-secondary hover:text-ink transition-colors px-3 py-2"
          target="_blank"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 2H2.5A1.5 1.5 0 001 3.5v8A1.5 1.5 0 002.5 13h8a1.5 1.5 0 001.5-1.5V9M9 1h4m0 0v4m0-4L6 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          View booking page
        </Link>
      </div>
    </aside>
  )
}
