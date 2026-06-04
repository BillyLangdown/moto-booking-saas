// RFC 5545 iCalendar utilities — no external dependencies

function foldLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = [line.slice(0, 75)]
  let i = 75
  while (i < line.length) {
    chunks.push(' ' + line.slice(i, i + 74))
    i += 74
  }
  return chunks.join('\r\n')
}

function escapeText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

// Parse through Date so any timezone format (Z, +00:00, etc.) becomes valid UTC
function dtFmt(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export interface ICSOptions {
  uid: string
  summary: string
  description: string
  location?: string
  startIso: string
  endIso: string
  organizerName: string
  organizerEmail: string
}

export function generateICS(opts: ICSOptions): string {
  const now = dtFmt(new Date().toISOString())
  const cnQuoted = opts.organizerName.replace(/"/g, '\\"')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Slick Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${opts.uid}@slick`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtFmt(opts.startIso)}`,
    `DTEND:${dtFmt(opts.endIso)}`,
    `SUMMARY:${escapeText(opts.summary)}`,
    `DESCRIPTION:${escapeText(opts.description)}`,
    ...(opts.location ? [`LOCATION:${escapeText(opts.location)}`] : []),
    `ORGANIZER;CN="${cnQuoted}":mailto:${opts.organizerEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.map(foldLine).join('\r\n')
}

export function addToCalendarUrl(appUrl: string, opts: {
  summary: string
  description: string
  location?: string
  startIso: string
  endIso: string
}): string {
  const p = new URLSearchParams({
    title:       opts.summary,
    start:       opts.startIso,
    end:         opts.endIso,
    description: opts.description,
    ...(opts.location ? { location: opts.location } : {}),
  })
  return `${appUrl}/calendar?${p}`
}

export function googleCalendarUrl(opts: {
  summary: string
  description: string
  location?: string
  startIso: string
  endIso: string
}): string {
  const parts = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(opts.summary)}`,
    `dates=${dtFmt(opts.startIso)}/${dtFmt(opts.endIso)}`,
    `details=${encodeURIComponent(opts.description)}`,
    ...(opts.location ? [`location=${encodeURIComponent(opts.location)}`] : []),
  ]
  return `https://calendar.google.com/calendar/r/eventedit?${parts.join('&')}`
}
