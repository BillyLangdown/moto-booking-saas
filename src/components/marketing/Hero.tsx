'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 pt-28">
      {/* Gradient blobs */}
      <div
        className="animate-blob-float pointer-events-none absolute -left-40 top-24 h-[420px] w-[420px] rounded-full opacity-25 blur-[120px]"
        style={{ background: '#2563EB' }}
      />
      <div
        className="animate-blob-float pointer-events-none absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full opacity-20 blur-[120px]"
        style={{ background: '#60a5fa', animationDelay: '3s' }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(11,17,32,0.5) 55%, #0B1120 100%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-secondary"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_#2563EB]" />
          Booking, sorted
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        >
          The calm system that
          <br />
          keeps your business
          <br />
          <span className="bg-gradient-to-r from-accent to-blue-300 bg-clip-text text-transparent">in order.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mx-auto mt-8 max-w-xl text-balance text-base text-secondary sm:text-lg"
        >
          Orla runs your bookings end to end — a branded booking page, an AI
          receptionist for enquiries that don&apos;t fit a fixed slot, and one
          dashboard (web or iOS) to confirm, get paid, and stay in sync with
          your calendar.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="#cta"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Get Orla for your business
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-medium text-secondary transition-colors hover:text-ink"
          >
            See how it works
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mt-6 text-xs text-muted"
        >
          Already have an account?{' '}
          <Link href="/login" className="text-secondary underline underline-offset-2 hover:text-ink">
            Sign in
          </Link>
        </motion.p>
      </div>
    </section>
  )
}
