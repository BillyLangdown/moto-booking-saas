import { Resend } from 'resend'
import type { Booking, Tenant } from '@/types'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

function formatISODate(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
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
          <td style="padding:10px 0;color:#64748b;width:40%;">Course</td>
          <td style="padding:10px 0;font-weight:500;">${booking.licenceType}</td>
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
        <p style="margin:0 0 4px;font-weight:600;color:#0f172a;">Contact the school</p>
        <p style="margin:0;white-space:pre-line;">${contactLines}</p>
      </div>` : ''}
    </div>
  </div>
</body>
</html>`

  const text = `Booking confirmed — ${booking.licenceType} with ${tenant.name}

Hi ${booking.name},

Course: ${booking.licenceType}
Date: ${start.date}
Time: ${start.time} – ${end.time}
Booking ref: ${booking.id}

${contactLines ? `Contact the school:\n${contactLines}` : ''}`

    await resend.emails.send({
      from: FROM,
      to: booking.email,
      subject: `Booking confirmed — ${booking.licenceType} with ${tenant.name}`,
      html,
      text,
    })
  } catch (err) {
    console.error('[email] Failed to send confirmation:', err)
  }
}
