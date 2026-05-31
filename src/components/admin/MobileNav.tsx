'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/dashboard/bookings',
    label: 'Bookings',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><path d="M6 2v4M12 2v4M2 8h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
  {
    href: '/dashboard/availability',
    label: 'Availability',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.6"/><path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6"/><path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.41 1.41M13.37 13.37l1.41 1.41M3.22 14.78l1.41-1.41M13.37 4.63l1.41-1.41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="flex h-12 border-t border-white/10">
      {NAV.map(({ href, label, icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={[
              'relative flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors',
              active ? 'text-white' : 'text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            {icon}
            {label}
            {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/60" />}
          </Link>
        )
      })}
    </nav>
  )
}
