'use server'

import { revalidatePath } from 'next/cache'
import { bookingService } from '@/services/bookingService'
import { availabilityService } from '@/services/availabilityService'
import { tenantService } from '@/services/tenantService'
import { sendBookingConfirmation } from '@/lib/email'
import type { Booking, CreateBookingInput, CreateSlotInput, IntakeQuestion, UpdateTenantInput } from '@/types'

export async function createBookingAction(input: CreateBookingInput): Promise<Booking> {
  const booking = await bookingService.createBooking(input)
  tenantService.getTenantById(input.tenantId).then((tenant) => {
    if (tenant) sendBookingConfirmation(booking, input.startTime, input.endTime, tenant)
  })
  return booking
}

export async function createSlotAction(input: CreateSlotInput): Promise<void> {
  await availabilityService.createSlot(input)
  revalidatePath('/dashboard/availability')
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
