'use client'

import { useState } from 'react'
import NavDrawer from './NavDrawer'

interface Props {
  tenantName: string
  tenantSlug: string
}

export default function TopBar({ tenantName, tenantSlug }: Props) {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50 flex h-14 items-center justify-between px-5 md:hidden backdrop-blur-sm border-b border-border" style={{ background: 'rgba(11,17,32,0.95)' }}
      >
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
        >
          <img src="/images/orla_booking_logo_light.png" alt="Orla" className="h-6 w-auto object-contain" />
        </button>

        <button
          onClick={() => setNavOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-accent hover:bg-accent/10 transition-colors"
          aria-label="Menu"
        >
          <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden="true">
            <path d="M1 1.5h14M1 7h14M1 12.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <NavDrawer
        open={navOpen}
        onClose={() => setNavOpen(false)}
        tenantName={tenantName}
        tenantSlug={tenantSlug}
      />
    </>
  )
}
