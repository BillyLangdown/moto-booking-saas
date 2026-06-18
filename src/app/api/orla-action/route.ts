import { NextRequest, NextResponse } from 'next/server'
import { getAuthTenant } from '@/lib/auth'
import { bookingService } from '@/services/bookingService'
import { availabilityService } from '@/services/availabilityService'
import { tenantService } from '@/services/tenantService'
import { sendReminderEmail } from '@/lib/email'
import { sendGmailReply } from '@/lib/google'

export type OrlaAction =
  | { action: 'cancel_booking';  bookingId: string; bookingName: string }
  | { action: 'confirm_booking'; bookingId: string; bookingName: string }
  | { action: 'no_show';         bookingId: string; bookingName: string }
  | { action: 'add_note';        bookingId: string; bookingName: string; note: string }
  | { action: 'send_reminder';   bookingId: string; bookingName: string; email: string }
  | { action: 'create_booking';  slotId: string; name: string; email: string; phone?: string; sessionType: string; startTime: string; endTime: string }
  | { action: 'block_time';      slotIds: string[]; description: string }
  | { action: 'reply_email';     threadId: string; inReplyToMessageId: string; to: string; subject: string; body: string }

export async function POST(req: NextRequest) {
  const tenant = await getAuthTenant()

  try {
    const { intent } = (await req.json()) as { intent: OrlaAction }

    switch (intent.action) {
      case 'cancel_booking': {
        await bookingService.cancelBooking(intent.bookingId)
        return NextResponse.json({
          summary: `${intent.bookingName}'s booking has been cancelled.`,
          cards: [{ type: 'info', title: 'Cancelled', body: `${intent.bookingName}'s booking is now cancelled.` }],
        })
      }

      case 'confirm_booking': {
        await bookingService.confirmBooking(intent.bookingId)
        return NextResponse.json({
          summary: `${intent.bookingName}'s booking is confirmed.`,
          cards: [{ type: 'info', title: 'Confirmed', body: `${intent.bookingName}'s booking has been confirmed.` }],
        })
      }

      case 'no_show': {
        const booking = await bookingService.getBookingById(intent.bookingId)
        const existingNotes = booking?.notes ?? ''
        const newNotes = existingNotes ? `${existingNotes}\nNo-show` : 'No-show'
        await bookingService.updateBooking(intent.bookingId, { status: 'cancelled', notes: newNotes })
        return NextResponse.json({
          summary: `${intent.bookingName} has been marked as a no-show.`,
          cards: [{ type: 'info', title: 'No-show recorded', body: `${intent.bookingName}'s booking is cancelled and marked as a no-show.` }],
        })
      }

      case 'add_note': {
        const booking = await bookingService.getBookingById(intent.bookingId)
        const existing = booking?.notes ?? ''
        const updated = existing ? `${existing}\n${intent.note}` : intent.note
        await bookingService.updateBooking(intent.bookingId, { notes: updated })
        return NextResponse.json({
          summary: `Note added to ${intent.bookingName}'s booking.`,
          cards: [{ type: 'info', title: 'Note added', body: intent.note }],
        })
      }

      case 'send_reminder': {
        const booking = await bookingService.getBookingById(intent.bookingId)
        if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        const fullTenant = await tenantService.getTenantById(tenant.id)
        if (!fullTenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        await sendReminderEmail(booking, fullTenant)
        return NextResponse.json({
          summary: `Reminder sent to ${intent.bookingName} at ${intent.email}.`,
          cards: [{ type: 'info', title: 'Reminder sent', body: `Email reminder sent to ${intent.email}.` }],
        })
      }

      case 'create_booking': {
        const slot = await availabilityService.getSlotById(intent.slotId)
        if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
        const booking = await bookingService.createBooking({
          tenantId:     tenant.id,
          slotId:       intent.slotId,
          resourceId:   slot.resourceId ?? '',
          name:         intent.name,
          email:        intent.email,
          phone:        intent.phone,
          sessionType:  intent.sessionType,
          intakeAnswers: {},
          startTime:    intent.startTime,
          endTime:      intent.endTime,
          status:       'confirmed',
        })
        return NextResponse.json({
          summary: `Booking created for ${intent.name}.`,
          cards: [{
            type: 'booking',
            title: booking.name,
            meta: `${booking.slot?.date ?? ''} · ${booking.slot?.startTime ?? ''} · ${booking.sessionType}`,
            body: 'Confirmed',
          }],
        })
      }

      case 'block_time': {
        await Promise.all(intent.slotIds.map(id => availabilityService.deleteSlot(id)))
        const count = intent.slotIds.length
        return NextResponse.json({
          summary: `${count} slot${count === 1 ? '' : 's'} removed — ${intent.description} is now blocked.`,
          cards: [{ type: 'info', title: 'Time blocked', body: intent.description }],
        })
      }

      case 'reply_email': {
        if (!tenant.googleConnected || !tenant.googleConnectedEmail) {
          return NextResponse.json({
            summary: 'Email reply failed.',
            cards: [{ type: 'info', title: 'Google not connected', body: 'Connect your Google account in Settings to send email replies.' }],
          })
        }
        await sendGmailReply(
          tenant.id,
          tenant.googleConnectedEmail,
          intent.to,
          intent.subject,
          intent.body,
          intent.threadId,
          intent.inReplyToMessageId,
        )
        return NextResponse.json({
          summary: `Reply sent to ${intent.to}.`,
          cards: [{ type: 'email', title: `Re: ${intent.subject}`, meta: `To: ${intent.to}`, body: intent.body }],
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (err) {
    console.error('[orla-action]', err)
    const message = err instanceof Error ? err.message : 'Something went wrong'
    return NextResponse.json({
      summary: 'That didn\'t work.',
      cards: [{ type: 'info', title: 'Error', body: message }],
    })
  }
}
