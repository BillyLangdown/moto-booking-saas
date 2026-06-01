import { NextRequest, NextResponse } from 'next/server'
import { bookingService } from '@/services/bookingService'
import { tenantService } from '@/services/tenantService'
import { sendBookingDeclined } from '@/lib/email'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const booking = await bookingService.getBookingById(id)
    if (!booking) return page('Not found', 'That booking could not be found.', false)
    if (booking.status === 'confirmed') return page('Already confirmed', 'This booking has already been confirmed and cannot be denied.', false)
    if (booking.status === 'cancelled') return page('Already denied', 'This booking has already been denied.', true)

    await bookingService.cancelBooking(id)
    const tenant = await tenantService.getTenantById(booking.tenantId)

    if (tenant && booking.startTimeIso && booking.endTimeIso) {
      await sendBookingDeclined(booking, booking.startTimeIso, booking.endTimeIso, tenant)
    }

    return page('Booking denied', `${booking.name}'s booking has been declined and they've been notified by email.`, true)
  } catch (err) {
    console.error('[booking/deny]', err)
    return page('Something went wrong', 'Please manage this booking from the dashboard instead.', false)
  }
}

function page(title: string, message: string, success: boolean) {
  const icon  = success ? '✓' : '✗'
  const color = success ? '#0f172a' : '#dc2626'
  const html  = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;padding:24px;box-sizing:border-box;">
  <div style="max-width:400px;width:100%;text-align:center;">
    <div style="font-size:44px;margin-bottom:16px;color:${color};">${icon}</div>
    <h1 style="margin:0 0 10px;font-size:20px;font-weight:600;color:#0f172a;">${title}</h1>
    <p style="margin:0;color:#64748b;font-size:15px;line-height:1.5;">${message}</p>
  </div>
</body>
</html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
