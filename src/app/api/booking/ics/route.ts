import { NextRequest, NextResponse } from 'next/server'
import { generateICS } from '@/lib/ics'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const title       = searchParams.get('title')       ?? 'Booking'
  const start       = searchParams.get('start')       ?? ''
  const end         = searchParams.get('end')         ?? ''
  const location    = searchParams.get('location')    ?? undefined
  const description = searchParams.get('description') ?? title

  if (!start || !end || isNaN(new Date(start).getTime())) {
    return new NextResponse('Missing or invalid dates', { status: 400 })
  }

  const icsContent = generateICS({
    uid:           randomUUID(),
    summary:       title,
    description,
    location,
    startIso:      start,
    endIso:        end,
    organizerName:  '',
    organizerEmail: 'noreply@example.com',
  })

  return new NextResponse(icsContent, {
    headers: {
      'Content-Type':        'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="booking.ics"',
      'Cache-Control':       'no-store',
    },
  })
}
