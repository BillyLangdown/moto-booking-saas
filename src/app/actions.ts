'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { bookingService } from '@/services/bookingService'
import { availabilityService } from '@/services/availabilityService'
import { tenantService } from '@/services/tenantService'
import { resourceService } from '@/services/resourceService'
import { sendBookingConfirmation, sendAdminNotification } from '@/lib/email'
import type { Booking, CreateBookingInput, CreateSlotInput, IntakeQuestion, UpdateTenantInput } from '@/types'

export async function createBookingAction(
  input: CreateBookingInput,
): Promise<{ booking?: Booking; error?: string }> {
  try {
    const tenant = await tenantService.getTenantById(input.tenantId)
    const autoConfirm = tenant?.autoConfirm !== false
    const booking = await bookingService.createBooking({ ...input, status: autoConfirm ? 'confirmed' : 'pending' })

    void (async () => {
      try {
        if (!tenant) return
        await sendAdminNotification(booking, input.startTime, input.endTime, tenant)
        if (autoConfirm) {
          await sendBookingConfirmation(booking, input.startTime, input.endTime, tenant)
        }
      } catch {
        // email failures are non-fatal
      }
    })()

    return { booking }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create booking' }
  }
}

export async function cancelBookingAction(bookingId: string): Promise<{ error?: string }> {
  try {
    await bookingService.cancelBooking(bookingId)
    revalidatePath('/dashboard/bookings')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to cancel booking' }
  }
}

export async function confirmBookingAction(bookingId: string): Promise<{ error?: string }> {
  try {
    const booking = await bookingService.confirmBooking(bookingId)
    void (async () => {
      try {
        const tenant = await tenantService.getTenantById(booking.tenantId)
        if (tenant && booking.startTimeIso && booking.endTimeIso) {
          await sendBookingConfirmation(booking, booking.startTimeIso, booking.endTimeIso, tenant)
        }
      } catch {
        // email failures are non-fatal
      }
    })()
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
  type: 'person' | 'asset',
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

export async function setPasswordAction(password: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return {}
}
