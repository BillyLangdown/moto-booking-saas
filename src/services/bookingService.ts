import { adminSupabase as supabase } from '@/lib/supabase/admin'
import type { Booking, BookingStatus, CreateBookingInput } from '@/types'

function isoToDate(iso: string): string {
  // Returns YYYY-MM-DD — safe: a 1-hour UTC offset never crosses midnight for typical slots
  return iso.slice(0, 10)
}

function isoToTime(iso: string): string {
  // Returns HH:MM from the ISO string. Stored as UTC; CalendarView is a client component
  // so the rendering environment resolves local display separately.
  return iso.slice(11, 16)
}

function mapBooking(row: Record<string, unknown>): Booking {
  const startIso = row.start_time as string | null | undefined
  const endIso   = row.end_time   as string | null | undefined

  return {
    id:          row.id as string,
    tenantId:    row.tenant_id as string,
    slotId:      (row.slot_id as string) ?? '',
    slot: startIso ? {
      date:        isoToDate(startIso),
      startTime:   isoToTime(startIso),
      endTime:     endIso ? isoToTime(endIso) : '',
      sessionType: (row.session_type as string) ?? '',
    } : undefined,
    name:        (row.customer_name as string) ?? '',
    email:       (row.customer_email as string) ?? '',
    phone:       (row.customer_phone as string) ?? undefined,
    notes:       (row.notes as string) ?? undefined,
    sessionType: (row.session_type as string) ?? '',
    intakeAnswers: (row.intake_answers as Record<string, string>) ?? {},
    createdAt:   row.created_at as string,
    status:      (row.status as BookingStatus) ?? 'confirmed',
    startTimeIso: startIso ?? undefined,
    endTimeIso:   endIso   ?? undefined,
  }
}

export const bookingService = {
  async getBookings(tenantId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) { console.error('[bookings] getBookings error:', error.message); return [] }
    if (!data) return []

    const rows = data as Record<string, unknown>[]
    const resourceIds = [...new Set(rows.map(r => r.resource_id as string).filter(Boolean))]
    let resourceMap = new Map<string, string>()
    if (resourceIds.length > 0) {
      const { data: resources } = await supabase
        .from('resources')
        .select('id, name')
        .in('id', resourceIds)
      if (resources) {
        resourceMap = new Map((resources as { id: string; name: string }[]).map(r => [r.id, r.name]))
      }
    }

    return rows.map(row => {
      const booking = mapBooking(row)
      const rid = row.resource_id as string | null
      if (rid) booking.resourceName = resourceMap.get(rid)
      return booking
    })
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
        customer_phone: input.phone ?? null,
        notes:          input.notes ?? null,
        session_type:   input.sessionType,
        intake_answers: input.intakeAnswers,
        start_time:     input.startTime,
        end_time:       input.endTime,
        status:         input.status ?? 'confirmed',
      })
      .select()
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Failed to create booking')
    return mapBooking(data as Record<string, unknown>)
  },

  async cancelBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
    if (error) throw new Error(error.message)
  },

  async confirmBooking(bookingId: string): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)
      .select()
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Failed to confirm booking')
    return mapBooking(data as Record<string, unknown>)
  },
}
