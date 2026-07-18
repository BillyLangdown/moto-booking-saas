'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Ask Orla', href: '#ask-orla' },
]

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-surface/80 backdrop-blur-md border-b border-border' : ''
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a href="#top" className="flex items-center gap-2.5">
          <img src="/images/orla_booking_logo_light.png" alt="Orla" className="h-6 w-auto object-contain" />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-secondary transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent/60 hover:bg-accent/10"
        >
          Sign in
        </Link>
      </div>
    </header>
  )
}
