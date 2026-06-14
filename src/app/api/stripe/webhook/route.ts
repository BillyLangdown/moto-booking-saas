import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminSupabase } from '@/lib/supabase/admin'
import { bookingService } from '@/services/bookingService'
import { tenantService } from '@/services/tenantService'
import { sendBookingConfirmation, sendAdminNotification } from '@/lib/email'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig) return new NextResponse('Missing stripe-signature', { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('[webhook] signature verification failed:', err)
    return new NextResponse(
      `Webhook error: ${err instanceof Error ? err.message : 'Unknown'}`,
      { status: 400 },
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session     = event.data.object as Stripe.Checkout.Session
    const bookingId   = session.metadata?.booking_id
    const captureMode = session.metadata?.capture_mode // 'automatic' | 'manual'
    if (!bookingId) return new NextResponse('OK', { status: 200 })

    if (captureMode === 'manual') {
      // Card authorized, hold placed — keep pending, store PI, notify owner to confirm
      await adminSupabase
        .from('bookings')
        .update({
          stripe_payment_intent_id: session.payment_intent as string | null,
          payment_authorized_at:    new Date().toISOString(),
        })
        .eq('id', bookingId)

      const booking = await bookingService.getBookingById(bookingId)
      if (booking) {
        const tenant = await tenantService.getTenantById(booking.tenantId)
        if (tenant) {
          let startTime = booking.startTimeIso
          let endTime   = booking.endTimeIso
          if (!startTime || !endTime) {
            const { data: slot } = await adminSupabase
              .from('availability_slots')
              .select('start_time, end_time')
              .eq('id', booking.slotId)
              .single()
            startTime = (slot?.start_time as string) ?? undefined
            endTime   = (slot?.end_time   as string) ?? undefined
          }
          if (startTime && endTime) {
            await sendAdminNotification(booking, startTime, endTime, tenant)
          }
        }
      }
    } else {
      // Automatic capture — confirm booking and email customer
      await adminSupabase
        .from('bookings')
        .update({
          status:                   'confirmed',
          stripe_payment_intent_id: session.payment_intent as string | null,
          amount_paid:              session.amount_total,
        })
        .eq('id', bookingId)

      const booking = await bookingService.getBookingById(bookingId)
      if (booking) {
        const tenant = await tenantService.getTenantById(booking.tenantId)
        if (tenant) {
          let startTime = booking.startTimeIso
          let endTime   = booking.endTimeIso
          if (!startTime || !endTime) {
            const { data: slot } = await adminSupabase
              .from('availability_slots')
              .select('start_time, end_time')
              .eq('id', booking.slotId)
              .single()
            startTime = (slot?.start_time as string) ?? undefined
            endTime   = (slot?.end_time   as string) ?? undefined
          }
          if (startTime && endTime) {
            await sendBookingConfirmation(booking, startTime, endTime, tenant)
          }
        }
      }
    }
  }

  return new NextResponse('OK', { status: 200 })
}
