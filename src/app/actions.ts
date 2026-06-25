'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { bookingService } from '@/services/bookingService'
import { availabilityService } from '@/services/availabilityService'
import { tenantService } from '@/services/tenantService'
import { resourceService } from '@/services/resourceService'
import { adminSupabase } from '@/lib/supabase/admin'
import { sendBookingConfirmation, sendAdminNotification, sendPaymentLink } from '@/lib/email'
import { sendPushToTenant } from '@/lib/apns'
import { stripe, createCheckoutSession, capturePaymentIntent, cancelPaymentIntent } from '@/lib/stripe'
import { createCalendarEvent, deleteCalendarEvent, disconnectGoogleAccount } from '@/lib/google'
import type { Booking, CreateBookingInput, CreateSlotInput, IntakeQuestion, PaymentMode, SessionTypePrices, UpdateTenantInput } from '@/types'

function getPaymentAmount(
  paymentMode: PaymentMode,
  sessionType: string,
  prices: SessionTypePrices,
): number {
  if (paymentMode === 'none') return 0
  const config = prices[sessionType]
  if (!config) return 0
  return paymentMode === 'deposit' ? (config.depositAmount ?? 0) : (config.price ?? 0)
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

async function resolveBookingTimes(booking: Booking): Promise<{ startTime: string; endTime: string } | null> {
  if (booking.startTimeIso && booking.endTimeIso) {
    return { startTime: booking.startTimeIso, endTime: booking.endTimeIso }
  }
  // Times missing on booking row - fetch directly from the slot
  const { data: slot } = await adminSupabase
    .from('availability_slots')
    .select('start_time, end_time')
    .eq('id', booking.slotId)
    .single()
  if (slot?.start_time && slot?.end_time) {
    return { startTime: slot.start_time as string, endTime: slot.end_time as string }
  }
  return null
}

export async function createBookingAction(
  input: CreateBookingInput,
): Promise<{ booking?: Booking; checkoutUrl?: string; error?: string }> {
  try {
    const tenant = await tenantService.getTenantById(input.tenantId)
    const autoConfirm = tenant?.autoConfirm === true

    const amount = tenant
      ? getPaymentAmount(tenant.paymentMode, input.sessionType, tenant.sessionTypePrices)
      : 0
    const needsPayment = amount > 0 && !!tenant?.stripeOnboarded && !!tenant?.stripeAccountId

    // ── DEPOSIT FLOW ──────────────────────────────────────────────────────────
    // Don't create the booking until the customer has successfully paid the deposit.
    // All booking details go into Stripe metadata; the webhook creates the booking
    // (and claims the slot) only after Stripe confirms the payment.
    if (tenant && needsPayment && tenant.paymentMode === 'deposit') {
      const checkoutUrl = await createCheckoutSession({
        tenantId:         input.tenantId,
        tenantSlug:       tenant.slug,
        stripeAccountId:  tenant.stripeAccountId!,
        amountInSmallest: amount,
        currency:         tenant.currency,
        label:            input.sessionType ? `${input.sessionType} — ${tenant.name}` : tenant.name,
        customerEmail:    input.email,
        cancelUrl:        `${appUrl}/book/${tenant.slug}`,
        appUrl,
        captureMethod:    'manual',
        pendingBooking: {
          slotId:       input.slotId,
          resourceId:   input.resourceId,
          name:         input.name,
          email:        input.email,
          phone:        input.phone ?? '',
          sessionType:  input.sessionType,
          startTime:    input.startTime,
          endTime:      input.endTime,
          intakeAnswers: input.intakeAnswers,
        },
      })
      return { checkoutUrl }
    }

    // ── ALL OTHER FLOWS ───────────────────────────────────────────────────────
    // auto-confirm + payment → capture immediately; manual confirm + payment → authorize only
    const captureMethod = autoConfirm ? 'automatic' : 'manual'

    // When payment is required booking stays pending until Stripe webhook confirms it
    const status = autoConfirm && !needsPayment ? 'confirmed' : 'pending'
    const booking = await bookingService.createBooking({ ...input, status })

    // For manual-capture flow the webhook sends the admin notification after card authorization
    if (tenant && !(needsPayment && !autoConfirm)) {
      await sendAdminNotification(booking, input.startTime, input.endTime, tenant)
      // Push to any admin devices registered for this tenant
      const pushBody = booking.status === 'pending'
        ? `${booking.name} requested a ${booking.sessionType} — tap to review`
        : `${booking.name} booked a ${booking.sessionType}`
      void sendPushToTenant(booking.tenantId, {
        title: 'New booking',
        body: pushBody,
        data: { bookingId: booking.id, type: 'new_booking' },
      })
    }

    if (needsPayment && tenant) {
      const checkoutUrl = await createCheckoutSession({
        bookingId:        booking.id,
        tenantId:         booking.tenantId,
        stripeAccountId:  tenant.stripeAccountId!,
        amountInSmallest: amount,
        currency:         tenant.currency,
        label:            booking.sessionType ? `${booking.sessionType} — ${tenant.name}` : tenant.name,
        customerEmail:    booking.email,
        cancelUrl:        `${appUrl}/book/${tenant.slug}`,
        appUrl,
        captureMethod,
      })
      return { checkoutUrl }
    }

    if (tenant && autoConfirm) {
      await sendBookingConfirmation(booking, input.startTime, input.endTime, tenant)
      if (tenant.googleConnected) {
        try {
          await createCalendarEvent(tenant.id, booking, input.startTime, input.endTime)
        } catch {
          // calendar sync failures are non-fatal
        }
      }
    }

    return { booking }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create booking' }
  }
}

export async function cancelBookingAction(bookingId: string): Promise<{ error?: string }> {
  try {
    const booking = await bookingService.getBookingById(bookingId)
    if (booking?.stripePaymentIntentId && booking.status !== 'confirmed' && booking.status !== 'cancelled') {
      const tenant = await tenantService.getTenantById(booking.tenantId)
      if (tenant?.stripeAccountId) {
        try {
          await cancelPaymentIntent(booking.stripePaymentIntentId, tenant.stripeAccountId)
        } catch {
          // non-fatal — Stripe auto-releases uncaptured holds after 7 days
        }
      }
    }
    if (booking?.googleEventId) {
      const tenant = await tenantService.getTenantById(booking.tenantId)
      if (tenant?.googleConnected) {
        try {
          await deleteCalendarEvent(tenant.id, booking.googleEventId)
        } catch {
          // non-fatal — stale calendar event is a minor inconvenience
        }
      }
    }
    await bookingService.cancelBooking(bookingId)
    revalidatePath('/dashboard/bookings')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to cancel booking' }
  }
}

export async function confirmBookingAction(bookingId: string): Promise<{ error?: string }> {
  try {
    const pendingBooking = await bookingService.getBookingById(bookingId)
    if (!pendingBooking) throw new Error('Booking not found')

    const tenant = await tenantService.getTenantById(pendingBooking.tenantId)
    const amount = tenant
      ? getPaymentAmount(tenant.paymentMode, pendingBooking.sessionType, tenant.sessionTypePrices)
      : 0
    const needsPayment = amount > 0 && !!tenant?.stripeOnboarded && !!tenant?.stripeAccountId

    if (needsPayment && pendingBooking.stripePaymentIntentId && tenant?.stripeAccountId) {
      // Card was already authorized (manual capture flow) — capture the hold now
      const amountReceived = await capturePaymentIntent(
        pendingBooking.stripePaymentIntentId,
        tenant.stripeAccountId,
      )
      const booking = await bookingService.confirmBooking(bookingId)
      await adminSupabase
        .from('bookings')
        .update({ amount_paid: amountReceived })
        .eq('id', bookingId)
      try {
        const times = await resolveBookingTimes(booking)
        if (tenant && times) {
          await sendBookingConfirmation(booking, times.startTime, times.endTime, tenant)
          if (tenant.googleConnected) {
            await createCalendarEvent(tenant.id, booking, times.startTime, times.endTime)
          }
        }
      } catch {
        // email/calendar failures are non-fatal
      }
    } else if (needsPayment && tenant) {
      // No authorized PI yet — send payment link, webhook confirms after payment
      const checkoutUrl = await createCheckoutSession({
        bookingId:        bookingId,
        tenantId:         pendingBooking.tenantId,
        stripeAccountId:  tenant.stripeAccountId!,
        amountInSmallest: amount,
        currency:         tenant.currency,
        label:            pendingBooking.sessionType ? `${pendingBooking.sessionType} - ${tenant.name}` : tenant.name,
        customerEmail:    pendingBooking.email,
        cancelUrl:        `${appUrl}/book/${tenant.slug}`,
        appUrl,
        captureMethod:    'automatic',
      })
      await adminSupabase
        .from('bookings')
        .update({ status: 'awaiting_payment' })
        .eq('id', bookingId)
      await sendPaymentLink(pendingBooking, checkoutUrl, amount, tenant.currency, tenant)
    } else {
      const booking = await bookingService.confirmBooking(bookingId)
      try {
        const times = await resolveBookingTimes(booking)
        if (tenant && times) {
          await sendBookingConfirmation(booking, times.startTime, times.endTime, tenant)
          if (tenant.googleConnected) {
            await createCalendarEvent(tenant.id, booking, times.startTime, times.endTime)
          }
        }
      } catch {
        // email/calendar failures are non-fatal
      }
    }

    revalidatePath('/dashboard/bookings')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to confirm booking' }
  }
}

export async function createSlotAction(input: CreateSlotInput): Promise<void> {
  await availabilityService.createSlot(input)
  revalidatePath('/dashboard/availability')
}

export async function createSlotsAction(inputs: CreateSlotInput[]): Promise<{ error?: string }> {
  try {
    await Promise.all(inputs.map((input) => availabilityService.createSlot(input)))
    revalidatePath('/dashboard/availability')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create slots' }
  }
}

export async function createResourceAction(
  tenantId: string,
  name: string,
  type: 'staff' | 'location' | 'resource',
): Promise<{ error?: string; resourceId?: string }> {
  try {
    const { id } = await resourceService.createResource(tenantId, name, type)
    revalidatePath('/dashboard/availability')
    revalidatePath('/dashboard/settings')
    return { resourceId: id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create resource' }
  }
}

export async function deleteResourceAction(resourceId: string): Promise<{ error?: string }> {
  try {
    await resourceService.deleteResource(resourceId)
    revalidatePath('/dashboard/availability')
    revalidatePath('/dashboard/settings')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete resource' }
  }
}

export async function deleteSlotAction(slotId: string): Promise<void> {
  await availabilityService.deleteSlot(slotId)
  revalidatePath('/dashboard/availability')
}

export async function updateTenantAction(
  tenantId: string,
  input: UpdateTenantInput,
): Promise<void> {
  await tenantService.updateTenant(tenantId, input)
  revalidatePath('/dashboard/settings')
}

export async function saveIntakeQuestionsAction(
  tenantId: string,
  questions: IntakeQuestion[],
): Promise<{ error?: string }> {
  try {
    await tenantService.updateIntakeQuestions(tenantId, questions)
    revalidatePath('/dashboard/settings')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save' }
  }
}

export async function completeOnboardingAction(tenantId: string): Promise<void> {
  await tenantService.completeOnboarding(tenantId)
}

export async function savePaymentSettingsAction(
  tenantId: string,
  opts: { paymentMode: PaymentMode; sessionTypePrices: SessionTypePrices; showPricesOnBookingPage: boolean },
): Promise<{ error?: string }> {
  try {
    await tenantService.savePaymentSettings(tenantId, opts)
    revalidatePath('/dashboard/settings')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save payment settings' }
  }
}

export async function disconnectStripeAction(tenantId: string): Promise<{ error?: string }> {
  try {
    await adminSupabase
      .from('tenants')
      .update({ stripe_account_id: null, stripe_onboarded: false })
      .eq('id', tenantId)
    revalidatePath('/dashboard/settings')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to disconnect Stripe' }
  }
}

export async function disconnectGoogleAction(tenantId: string): Promise<{ error?: string }> {
  try {
    await disconnectGoogleAccount(tenantId)
    revalidatePath('/dashboard/settings')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to disconnect Google' }
  }
}

export async function setPasswordAction(password: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return {}
}
