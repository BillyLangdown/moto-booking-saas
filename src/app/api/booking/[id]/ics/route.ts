import { NextRequest, NextResponse } from 'next/server'
import { bookingService } from '@/services/bookingService'
import { tenantService } from '@/services/tenantService'
import { generateICS } from '@/lib/ics'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const booking = await bookingService.getBookingById(id)
  if (!booking || !booking.startTimeIso || !booking.endTimeIso) {
    return new NextResponse('Not found', { status: 404 })
  }

  const tenant = await tenantService.getTenantById(booking.tenantId)

  const icsContent = generateICS({
    uid: booking.id,
    summary: booking.sessionType
      ? `${booking.sessionType} – ${tenant?.name ?? 'Booking'}`
      : (tenant?.name ?? 'Booking'),
    description: tenant
      ? `Booking with ${tenant.name}. Ref: ${booking.id}`
      : `Ref: ${booking.id}`,
    location: tenant?.address || undefined,
    startIso: booking.startTimeIso,
    endIso: booking.endTimeIso,
    organizerName: tenant?.name ?? 'Booking',
    organizerEmail: tenant?.email ?? 'noreply@example.com',
  })

  return new NextResponse(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="booking.ics"`,
      'Cache-Control': 'no-store',
    },
  })
}
