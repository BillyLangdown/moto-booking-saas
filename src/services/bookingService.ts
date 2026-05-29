import { createClient } from '@supabase/supabase-js'
import type { Booking, BookingStatus, CreateBookingInput, LicenceType } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
)

// DB stores customer_name / customer_email — we map to the app's name / email.
function mapBooking(row: Record<string, unknown>): Booking {
  return {
    id:          row.id as string,
    tenantId:    row.tenant_id as string,
    slotId:      (row.slot_id as string) ?? '',
    name:        (row.customer_name as string) ?? '',
    email:       (row.customer_email as string) ?? '',
    notes:       (row.notes as string) ?? undefined,
    licenceType: (row.licence_type as LicenceType) ?? 'CBT',
    createdAt:   row.created_at as string,
    status:      (row.status as BookingStatus) ?? 'confirmed',
  }
}

export const bookingService = {
  async getBookings(tenantId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return (data as Record<string, unknown>[]).map(mapBooking)
  },

  async getBookingById(id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
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
        notes:          input.notes ?? null,
        licence_type:   input.licenceType,
        start_time:     input.startTime,
        end_time:       input.endTime,
        status:         'confirmed',
      })
      .select()
      .single()

    if (error || !data) {
      console.error('[bookingService] createBooking error:', error)
      throw new Error(error?.message ?? 'Failed to create booking')
    }

    console.log('[bookingService] Booking created:', data)
    return mapBooking(data as Record<string, unknown>)
  },
}
