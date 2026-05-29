'use server'

import { bookingService } from '@/services/bookingService'
import type { CreateBookingInput, Booking } from '@/types'

export async function createBookingAction(input: CreateBookingInput): Promise<Booking> {
  return bookingService.createBooking(input)
}
