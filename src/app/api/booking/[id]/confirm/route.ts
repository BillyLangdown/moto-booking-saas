import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { bookingService } from '@/services/bookingService'
import { tenantService } from '@/services/tenantService'
import { adminSupabase } from '@/lib/supabase/admin'
import { sendBookingConfirmation } from '@/lib/email'
import { createCalendarEvent } from '@/lib/google'

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
    if (booking.status === 'confirmed') return page('Already confirmed', `${booking.name}'s booking is already confirmed.`, true)
    if (booking.status === 'cancelled') return page('Already cancelled', 'This booking was cancelled and cannot be confirmed.', false)

    const confirmed = await bookingService.confirmBooking(id)
    const tenant = await tenantService.getTenantById(confirmed.tenantId)

    let startTime = confirmed.startTimeIso
    let endTime   = confirmed.endTimeIso
    if ((!startTime || !endTime) && confirmed.slotId) {
      const { data: slot } = await adminSupabase
        .from('availability_slots').select('start_time, end_time').eq('id', confirmed.slotId).single()
      startTime = slot?.start_time as string ?? startTime
      endTime   = slot?.end_time   as string ?? endTime
    }
    if ((!startTime || !endTime) && confirmed.proposedDate) {
      // Open Enquiry bookings only ever collect a date/time, not a duration -
      // use a nominal 1 hour window so the confirmation email still sends.
      const start = new Date(`${confirmed.proposedDate}T${confirmed.proposedTime ?? '09:00'}:00.000Z`)
      startTime = start.toISOString()
      endTime   = new Date(start.getTime() + 60 * 60 * 1000).toISOString()
    }

    if (tenant && startTime && endTime) {
      await sendBookingConfirmation(confirmed, startTime, endTime, tenant)
      if (tenant.googleConnected) {
        try {
          await createCalendarEvent(tenant.id, confirmed, startTime, endTime)
        } catch {
          // calendar sync failures are non-fatal
        }
      }
    }

    return page(
      'Booking confirmed',
      `${booking.name}'s booking has been confirmed and they've been sent a confirmation email.`,
      true,
    )
  } catch (err) {
    console.error('[booking/confirm]', err)
    return page('Something went wrong', 'Please confirm this booking from the dashboard instead.', false)
  }
}

// ── Mobile POST handler ───────────────────────────────────────────────────────
// Called by the iOS app with a Bearer token; returns JSON instead of HTML.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const authHeader = req.headers.get('authorization') ?? ''
  const accessToken = authHeader.replace(/^bearer /i, '').trim()
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { authorization: `Bearer ${accessToken}` } } }
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const booking = await bookingService.getBookingById(id)
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.status === 'confirmed') return NextResponse.json({ ok: true, alreadyConfirmed: true })
    if (booking.status === 'cancelled') return NextResponse.json({ error: 'Booking is cancelled' }, { status: 400 })

    const confirmed = await bookingService.confirmBooking(id)
    const tenant = await tenantService.getTenantById(confirmed.tenantId)

    let startTime = confirmed.startTimeIso
    let endTime   = confirmed.endTimeIso
    if ((!startTime || !endTime) && confirmed.slotId) {
      const { data: slot } = await adminSupabase
        .from('availability_slots').select('start_time, end_time').eq('id', confirmed.slotId).single()
      startTime = slot?.start_time as string ?? startTime
      endTime   = slot?.end_time   as string ?? endTime
    }
    if ((!startTime || !endTime) && confirmed.proposedDate) {
      // Open Enquiry bookings only ever collect a date/time, not a duration -
      // use a nominal 1 hour window so the confirmation email still sends.
      const start = new Date(`${confirmed.proposedDate}T${confirmed.proposedTime ?? '09:00'}:00.000Z`)
      startTime = start.toISOString()
      endTime   = new Date(start.getTime() + 60 * 60 * 1000).toISOString()
    }

    if (tenant && startTime && endTime) {
      await sendBookingConfirmation(confirmed, startTime, endTime, tenant)
      if (tenant.googleConnected) {
        try { await createCalendarEvent(tenant.id, confirmed, startTime, endTime) } catch {}
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[booking/confirm POST]', err)
    return NextResponse.json({ error: 'Failed to confirm booking' }, { status: 500 })
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
    <p style="text-align:center;margin:20px 0 0;font-size:12px;color:#94a3b8;">Orla Booking</p>
  </div>
</body>
</html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
