'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/dashboard/bookings',
    label: 'Today',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="4.5" width="15" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><path d="M7 2.5v4M13 2.5v4M2.5 9h15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
  {
    href: '/dashboard/availability',
    label: 'Availability',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6"/><path d="M10 6v4.5l2.75 2.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.75" stroke="currentColor" strokeWidth="1.6"/><path d="M10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18M4.1 4.1l1.77 1.77M14.13 14.13l1.77 1.77M4.1 15.9l1.77-1.77M14.13 5.87l1.77-1.77" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="flex h-14 border-t border-white/10">
      {NAV.map(({ href, label, icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={[
              'relative flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
              active ? 'text-accent' : 'text-white/40 hover:text-white/65',
            ].join(' ')}
          >
            {icon}
            {label}
            {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] bg-accent rounded-t-full" />}
          </Link>
        )
      })}
    </nav>
  )
}
