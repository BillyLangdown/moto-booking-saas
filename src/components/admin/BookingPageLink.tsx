'use client'

import { useState } from 'react'

interface Props {
  slug: string
  variant?: 'compact' | 'full'
}

export default function BookingPageLink({ slug, variant = 'compact' }: Props) {
  const [copied, setCopied] = useState(false)

  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${slug}`

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: 'Book online', url })
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  if (variant === 'full') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Booking page</p>
        <div className="flex items-center gap-2 bg-subtle border border-border px-3 py-2">
          <span className="font-mono text-xs text-ink break-all flex-1">/book/{slug}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={`/book/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-secondary hover:text-ink transition-colors whitespace-nowrap"
            >
              Open
            </a>
            <span className="text-border">·</span>
            <button
              type="button"
              onClick={handleShare}
              className="text-xs font-medium transition-colors whitespace-nowrap text-secondary hover:text-ink"
            >
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Compact: always show icon + short label
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <a
        href={`/book/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-ink transition-colors border border-border px-2.5 py-1.5 whitespace-nowrap"
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
          <path d="M5.5 2.5H2.5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M8 1.5h3.5v3.5M11.5 1.5 6 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        View page
      </a>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-ink hover:bg-ink/85 transition-colors px-2.5 py-1.5 whitespace-nowrap"
      >
        {copied ? (
          <>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
              <path d="M2.5 6.5l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
              <path d="M6.5 1.5v7M3.5 4l3-2.5L10 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 9v2a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Share link
          </>
        )}
      </button>
    </div>
  )
}
