import { NextRequest, NextResponse } from 'next/server'
import { bookingService } from '@/services/bookingService'
import { tenantService } from '@/services/tenantService'
import { sendBookingConfirmation } from '@/lib/email'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const booking = await bookingService.getBookingById(id)
    if (!booking) return page('Not found', 'That booking could not be found.', false)
    if (booking.status === 'confirmed') return page('Already confirmed', 'This booking has already been confirmed.', true)
    if (booking.status === 'cancelled') return page('Already cancelled', 'This booking was cancelled and cannot be confirmed.', false)

    const confirmed = await bookingService.confirmBooking(id)
    const tenant = await tenantService.getTenantById(confirmed.tenantId)

    if (tenant && confirmed.startTimeIso && confirmed.endTimeIso) {
      await sendBookingConfirmation(confirmed, confirmed.startTimeIso, confirmed.endTimeIso, tenant)
    }

    return page('Booking confirmed', `${booking.name}'s booking has been confirmed and they've been notified by email.`, true)
  } catch (err) {
    console.error('[booking/confirm]', err)
    return page('Something went wrong', 'Please confirm this booking from the dashboard instead.', false)
  }
}

function page(title: string, message: string, success: boolean) {
  const icon  = success ? '✓' : '✗'
  const color = success ? '#16a34a' : '#dc2626'
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
