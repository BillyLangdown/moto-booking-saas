import { Resend } from 'resend'
import type { Booking, Tenant } from '@/types'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

function formatISODate(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }),
  }
}

export async function sendBookingConfirmation(
  booking: Booking,
  startTime: string,
  endTime: string,
  tenant: Tenant,
): Promise<void> {
  try {
  if (!resend) return

  const start = formatISODate(startTime)
  const end   = formatISODate(endTime)

  const contactLines = [
    tenant.email && `Email: ${tenant.email}`,
    tenant.phone && `Phone: ${tenant.phone}`,
  ].filter(Boolean).join('\n')

  const accentColor = tenant.branding?.accentColor ?? '#6366f1'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#0f172a;background:#f8fafc;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:${accentColor};padding:24px 28px;">
      <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">${tenant.name}</p>
    </div>
    <div style="padding:28px;">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;">Booking confirmed ✓</h1>
      <p style="margin:0 0 24px;color:#64748b;font-size:15px;">Hi ${booking.name}, your place is secured.</p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 0;color:#64748b;width:40%;">Session type</td>
          <td style="padding:10px 0;font-weight:500;">${booking.sessionType}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 0;color:#64748b;">Date</td>
          <td style="padding:10px 0;font-weight:500;">${start.date}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 0;color:#64748b;">Time</td>
          <td style="padding:10px 0;font-weight:500;">${start.time} – ${end.time}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 0;color:#64748b;">Booking ref</td>
          <td style="padding:10px 0;font-family:monospace;font-size:12px;">${booking.id}</td>
        </tr>
      </table>

      ${contactLines ? `
      <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:8px;font-size:13px;color:#64748b;">
        <p style="margin:0 0 4px;font-weight:600;color:#0f172a;">Contact the business</p>
        <p style="margin:0;white-space:pre-line;">${contactLines}</p>
      </div>` : ''}
    </div>
  </div>
</body>
</html>`

  const text = `Booking confirmed — ${booking.sessionType} with ${tenant.name}

Hi ${booking.name},

Session type: ${booking.sessionType}
Date: ${start.date}
Time: ${start.time} – ${end.time}
Booking ref: ${booking.id}

${contactLines ? `Contact the business:\n${contactLines}` : ''}`

    await resend.emails.send({
      from: FROM,
      to: booking.email,
      subject: `Booking confirmed — ${booking.sessionType} with ${tenant.name}`,
      html,
      text,
    })
  } catch (err) {
    console.error('[email] Failed to send confirmation:', err)
  }
}

export async function sendAdminNotification(
  booking: Booking,
  startTime: string,
  endTime: string,
  tenant: Tenant,
): Promise<void> {
  try {
    if (!resend || !tenant.email) return

    const start = formatISODate(startTime)
    const end   = formatISODate(endTime)
    const accentColor = tenant.branding?.accentColor ?? '#6366f1'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const intakeRows = booking.intakeAnswers && Object.keys(booking.intakeAnswers).length > 0
      ? Object.entries(booking.intakeAnswers).map(([q, a]) => `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 0;color:#64748b;width:40%;vertical-align:top;">${q}</td>
          <td style="padding:10px 0;font-weight:500;">${a}</td>
        </tr>`).join('')
      : ''

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#0f172a;background:#f8fafc;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:${accentColor};padding:24px 28px;">
      <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">${tenant.name}</p>
      <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">New booking received</p>
    </div>
    <div style="padding:28px;">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;">New booking — ${booking.sessionType}</h1>
      <p style="margin:0 0 24px;color:#64748b;font-size:15px;">A customer has just booked a session.</p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 0;color:#64748b;width:40%;">Customer</td>
          <td style="padding:10px 0;font-weight:500;">${booking.name}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 0;color:#64748b;">Email</td>
          <td style="padding:10px 0;"><a href="mailto:${booking.email}" style="color:${accentColor};">${booking.email}</a></td>
        </tr>
        ${booking.phone ? `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 0;color:#64748b;">Phone</td>
          <td style="padding:10px 0;font-weight:500;">${booking.phone}</td>
        </tr>` : ''}
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 0;color:#64748b;">Session type</td>
          <td style="padding:10px 0;font-weight:500;">${booking.sessionType}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 0;color:#64748b;">Date</td>
          <td style="padding:10px 0;font-weight:500;">${start.date}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 0;color:#64748b;">Time</td>
          <td style="padding:10px 0;font-weight:500;">${start.time} – ${end.time}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 0;color:#64748b;">Status</td>
          <td style="padding:10px 0;"><span style="display:inline-block;padding:2px 10px;background:#dcfce7;color:#166534;border-radius:999px;font-size:12px;font-weight:600;">Confirmed</span></td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 0;color:#64748b;">Booking ref</td>
          <td style="padding:10px 0;font-family:monospace;font-size:12px;">${booking.id}</td>
        </tr>
        ${intakeRows}
      </table>

      ${booking.notes ? `
      <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:8px;font-size:13px;color:#64748b;">
        <p style="margin:0 0 4px;font-weight:600;color:#0f172a;">Customer notes</p>
        <p style="margin:0;">${booking.notes}</p>
      </div>` : ''}

      <div style="margin-top:28px;">
        <a href="${appUrl}/dashboard/bookings" style="display:inline-block;padding:12px 24px;background:${accentColor};color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">View in dashboard →</a>
      </div>
    </div>
  </div>
</body>
</html>`

    const text = `New booking — ${booking.sessionType}

Customer: ${booking.name}
Email: ${booking.email}
${booking.phone ? `Phone: ${booking.phone}\n` : ''}Session type: ${booking.sessionType}
Date: ${start.date}
Time: ${start.time} – ${end.time}
Status: Confirmed
Booking ref: ${booking.id}
${booking.notes ? `\nNotes: ${booking.notes}` : ''}`

    await resend.emails.send({
      from: FROM,
      to: tenant.email,
      subject: `New booking — ${booking.name} (${booking.sessionType})`,
      html,
      text,
    })
  } catch (err) {
    console.error('[email] Failed to send admin notification:', err)
  }
}
