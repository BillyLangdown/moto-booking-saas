import { createClient } from '@supabase/supabase-js'
import type { AvailabilitySlot, LicenceType } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
)

// start_time / end_time are stored as TIMESTAMP in Supabase.
// We derive the ISO date and HH:mm time strings from them.
function parseTimestamp(ts: string): { date: string; time: string } {
  const d = new Date(ts)
  const date = d.toISOString().split('T')[0]
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return { date, time }
}

function mapSlot(row: Record<string, unknown>): AvailabilitySlot {
  const { date, time: startTime } = parseTimestamp(row.start_time as string)
  const { time: endTime }         = parseTimestamp(row.end_time as string)

  const resource = row.resource as Record<string, unknown> | null

  return {
    id:           row.id as string,
    tenantId:     row.tenant_id as string,
    resourceId:   row.resource_id as string,
    resource: {
      id:       resource?.id as string ?? row.resource_id as string,
      tenantId: row.tenant_id as string,
      name:     resource?.name as string ?? 'Unknown',
      type:     (resource?.type as 'instructor' | 'bike') ?? 'instructor',
    },
    licenceType: (row.licence_type as LicenceType) ?? 'CBT',
    date,
    startTime,
    endTime,
    capacity: (row.capacity as number) ?? 1,
    booked:   (row.booked as number) ?? 0,
  }
}

export const availabilityService = {
  /** Returns only slots with remaining capacity, soonest first. */
  async getSlots(tenantId: string): Promise<AvailabilitySlot[]> {
    const { data, error } = await supabase
      .from('availability_slots')
      .select('*, resource:resources(*)')
      .eq('tenant_id', tenantId)
      .gt('start_time', new Date().toISOString()) // future slots only
      .order('start_time', { ascending: true })

    if (error || !data) return []

    return (data as Record<string, unknown>[])
      .map(mapSlot)
      .filter((s) => s.booked < s.capacity)
  },

  /** Returns all slots regardless of capacity (for admin view). */
  async getAllSlots(tenantId: string): Promise<AvailabilitySlot[]> {
    const { data, error } = await supabase
      .from('availability_slots')
      .select('*, resource:resources(*)')
      .eq('tenant_id', tenantId)
      .order('start_time', { ascending: true })

    if (error || !data) return []
    return (data as Record<string, unknown>[]).map(mapSlot)
  },

  async getSlotById(slotId: string): Promise<AvailabilitySlot | null> {
    const { data, error } = await supabase
      .from('availability_slots')
      .select('*, resource:resources(*)')
      .eq('id', slotId)
      .single()

    if (error || !data) return null
    return mapSlot(data as Record<string, unknown>)
  },
}
