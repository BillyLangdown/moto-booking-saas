import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add to Calendar' }

// Formats ISO string to Google/Yahoo calendar date format: 20240115T100000Z
function dtFmt(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function googleUrl(title: string, start: string, end: string, location?: string, description?: string) {
  const p = new URLSearchParams({
    text:   title,
    dates:  `${dtFmt(start)}/${dtFmt(end)}`,
    ...(description && { details: description }),
    ...(location    && { location }),
  })
  return `https://calendar.google.com/calendar/r/eventedit?${p}`
}

function outlookUrl(title: string, start: string, end: string, location?: string, description?: string) {
  const p = new URLSearchParams({
    rru:      'addevent',
    startdt:  start,
    enddt:    end,
    subject:  title,
    ...(description && { body: description }),
    ...(location    && { location }),
  })
  return `https://outlook.live.com/calendar/0/action/compose?${p}`
}

function yahooUrl(title: string, start: string, end: string, location?: string, description?: string) {
  const p = new URLSearchParams({
    v:     '60',
    title,
    st:    dtFmt(start),
    et:    dtFmt(end),
    ...(description && { desc: description }),
    ...(location    && { in_loc: location }),
  })
  return `https://calendar.yahoo.com/?${p}`
}

interface Props {
  searchParams: Promise<{ title?: string; start?: string; end?: string; location?: string; description?: string }>
}

export default async function CalendarPage({ searchParams }: Props) {
  const { title = 'Booking', start, end, location, description } = await searchParams

  const hasValidDates = start && end && !isNaN(new Date(start).getTime()) && !isNaN(new Date(end).getTime())

  const formattedDate = hasValidDates
    ? new Date(start).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    : null

  const formattedTime = hasValidDates
    ? `${new Date(start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })} – ${new Date(end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}`
    : null

  const options = hasValidDates ? [
    {
      name: 'Google Calendar',
      href: googleUrl(title, start, end, location, description),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      name: 'Apple Calendar',
      href: `/api/booking/ics?title=${encodeURIComponent(title)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}${location ? `&location=${encodeURIComponent(location)}` : ''}${description ? `&description=${encodeURIComponent(description)}` : ''}`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      name: 'Outlook',
      href: outlookUrl(title, start, end, location, description),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      name: 'Yahoo Calendar',
      href: yahooUrl(title, start, end, location, description),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ] : []

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 pt-8 pb-6 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary mb-2">Add to calendar</p>
            <h1 className="text-lg font-bold text-ink leading-snug">{title}</h1>
            {formattedDate && (
              <p className="text-sm text-secondary mt-1">{formattedDate}</p>
            )}
            {formattedTime && (
              <p className="text-sm text-secondary">{formattedTime}</p>
            )}
            {location && (
              <p className="text-sm text-secondary mt-0.5">{location}</p>
            )}
          </div>

          <div className="p-3 flex flex-col gap-1">
            {options.length > 0 ? options.map((opt) => (
              <a
                key={opt.name}
                href={opt.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-ink hover:bg-surface transition-colors"
              >
                {opt.icon}
                {opt.name}
                <svg className="ml-auto text-secondary" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            )) : (
              <p className="px-4 py-6 text-sm text-secondary text-center">Event details are missing.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
