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

function fillTimesFromSlot(row: Record<string, unknown>): void {
  const slot = row.availability_slots as { start_time?: string; end_time?: string } | null
  if (!row.start_time && slot?.start_time) row.start_time = slot.start_time
  if (!row.end_time && slot?.end_time) row.end_time = slot.end_time
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
      .select('*, availability_slots!slot_id(start_time, end_time)')
      .eq('id', id)
      .single()

    if (error || !data) return null
    const row = data as Record<string, unknown>
    fillTimesFromSlot(row)
    return mapBooking(row)
  },

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    // Atomically reserve a seat. Returns false if slot is already full.
    const { data: claimed, error: claimError } = await supabase
      .rpc('claim_slot', { p_slot_id: input.slotId })
    if (claimError) {
      if (claimError.message.includes('Could not find the function')) {
        // claim_slot migration not yet applied — non-atomic fallback
        console.warn('[booking] claim_slot not found — run supabase/migrations/20240101000000_claim_slot.sql')
        const { data: slot } = await supabase
          .from('availability_slots')
          .select('booked, capacity')
          .eq('id', input.slotId)
          .single()
        if (!slot || (slot.booked as number) >= (slot.capacity as number)) {
          throw new Error('This slot is fully booked. Please go back and choose another time.')
        }
      } else {
        throw new Error(`Unable to reserve slot: ${claimError.message}`)
      }
    } else if (!claimed) {
      throw new Error('This slot is fully booked. Please go back and choose another time.')
    }

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

    if (error || !data) {
      // Roll back the claimed seat if the insert failed
      void supabase.rpc('release_slot', { p_slot_id: input.slotId })
      throw new Error(error?.message ?? 'Failed to create booking')
    }

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
      .select('*, availability_slots!slot_id(start_time, end_time)')
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Failed to confirm booking')
    const row = data as Record<string, unknown>
    fillTimesFromSlot(row)
    return mapBooking(row)
  },
}
