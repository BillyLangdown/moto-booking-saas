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
        className="fixed top-0 inset-x-0 z-50 flex h-14 items-center justify-between px-5 md:hidden"
        style={{ background: '#1F2937' }}
      >
        <button
          onClick={() => setNavOpen(true)}
          className="text-white font-semibold tracking-[0.18em] text-sm"
          aria-label="Open navigation"
        >
          orla
        </button>

        <button
          onClick={() => setNavOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
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
