import { NextRequest, NextResponse } from 'next/server'
import { bookingService } from '@/services/bookingService'
import { tenantService } from '@/services/tenantService'
import { sendBookingDeclined } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const booking = await bookingService.getBookingById(id)
    if (!booking) return page('Booking not found', "We couldn't find that booking.", false)
    if (booking.status === 'confirmed') return page('Already confirmed', 'This booking has already been confirmed and cannot be declined.', false)
    if (booking.status === 'cancelled') return page('Already declined', `${booking.name}'s booking has already been declined.`, true)

    await bookingService.cancelBooking(id)
    const tenant = await tenantService.getTenantById(booking.tenantId)

    if (tenant && booking.startTimeIso && booking.endTimeIso) {
      await sendBookingDeclined(booking, booking.startTimeIso, booking.endTimeIso, tenant)
    }

    return page(
      'Booking declined',
      `${booking.name}'s booking has been declined and they've been notified by email.`,
      true,
    )
  } catch (err) {
    console.error('[booking/deny]', err)
    return page('Something went wrong', 'Please manage this booking from the dashboard instead.', false)
  }
}

function page(title: string, message: string, success: boolean) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;background:#f8fafc;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;">
  <div style="max-width:420px;width:100%;">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
      <div style="padding:40px 36px 36px;text-align:center;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:50%;background:${success ? '#f0fdf4' : '#fef2f2'};margin-bottom:24px;">
          ${success
            ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path stroke="#16a34a" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>'
            : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path stroke="#dc2626" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>'
          }
        </div>
        <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">${title}</h1>
        <p style="margin:0 0 32px;color:#64748b;font-size:15px;line-height:1.65;">${message}</p>
        <a href="${APP_URL}/dashboard/bookings"
          style="display:inline-block;padding:13px 28px;background:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;letter-spacing:-0.01em;">
          Go to dashboard
        </a>
      </div>
    </div>
    <p style="text-align:center;margin:20px 0 0;font-size:12px;color:#94a3b8;">Slick Booking</p>
  </div>
</body>
</html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
