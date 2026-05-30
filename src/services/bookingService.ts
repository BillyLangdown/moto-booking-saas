import { adminSupabase as supabase } from '@/lib/supabase/admin'
import type { Booking, BookingStatus, CreateBookingInput, LicenceType } from '@/types'

function mapBooking(row: Record<string, unknown>): Booking {
  const slotRow = row.slot as Record<string, string> | null | undefined
  return {
    id:          row.id as string,
    tenantId:    row.tenant_id as string,
    slotId:      (row.slot_id as string) ?? '',
    slot: slotRow ? {
      date:        slotRow.date,
      startTime:   slotRow.start_time,
      endTime:     slotRow.end_time,
      licenceType: (slotRow.licence_type as LicenceType) ?? 'CBT',
    } : undefined,
    name:        (row.customer_name as string) ?? '',
    email:       (row.customer_email as string) ?? '',
    phone:       (row.customer_phone as string) ?? undefined,
    notes:       (row.notes as string) ?? undefined,
    licenceType: (row.licence_type as LicenceType) ?? 'CBT',
    intakeAnswers: (row.intake_answers as Record<string, string>) ?? {},
    createdAt:   row.created_at as string,
    status:      (row.status as BookingStatus) ?? 'confirmed',
  }
}

export const bookingService = {
  async getBookings(tenantId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, slot:availability_slots(date, start_time, end_time, licence_type)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return (data as Record<string, unknown>[]).map(mapBooking)
  },

  async getBookingById(id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, slot:availability_slots(date, start_time, end_time, licence_type)')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return mapBooking(data as Record<string, unknown>)
  },

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        tenant_id:      input.tenantId,
        slot_id:        input.slotId,
        resource_id:    input.resourceId,
        customer_name:  input.name,
        customer_email: input.email,
        customer_phone: input.phone ?? null,
        notes:          input.notes ?? null,
        licence_type:   input.licenceType,
        intake_answers: input.intakeAnswers,
        start_time:     input.startTime,
        end_time:       input.endTime,
        status:         'confirmed',
      })
      .select()
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Failed to create booking')
    return mapBooking(data as Record<string, unknown>)
  },
}
