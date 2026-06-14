import { adminSupabase as supabase } from '@/lib/supabase/admin'
import type { AvailabilitySlot, CreateSlotInput, Resource, ResourceType } from '@/types'

// start_time / end_time are stored as TIMESTAMP in Supabase.
// We derive the ISO date and HH:mm time strings from them.
function parseTimestamp(ts: string): { date: string; time: string } {
  const d = new Date(ts)
  const date = d.toISOString().split('T')[0]
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return { date, time }
}

function toResource(r: Record<string, unknown> | null, tenantId: string, fallbackType: ResourceType): Resource | undefined {
  if (!r) return undefined
  return {
    id:       r.id as string,
    tenantId,
    name:     r.name as string,
    type:     (r.type as ResourceType) ?? fallbackType,
  }
}

function mapSlot(row: Record<string, unknown>): AvailabilitySlot {
  const { date, time: startTime } = parseTimestamp(row.start_time as string)
  const { time: endTime }         = parseTimestamp(row.end_time as string)
  const tenantId = row.tenant_id as string

  return {
    id:         row.id as string,
    tenantId,
    resourceId: (row.resource_id as string) ?? undefined,
    resource:   toResource(row.resource as Record<string, unknown> | null, tenantId, 'staff'),
    staff:      toResource(row.staff     as Record<string, unknown> | null, tenantId, 'staff'),
    location:   toResource(row.location  as Record<string, unknown> | null, tenantId, 'location'),
    equipment:  toResource(row.equipment as Record<string, unknown> | null, tenantId, 'resource'),
    sessionType: (row.session_type as string) ?? '',
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
      .select('*, resource:resources!resource_id(*), staff:resources!staff_id(*), location:resources!location_id(*), equipment:resources!equipment_id(*)')
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
      .select('*, resource:resources!resource_id(*), staff:resources!staff_id(*), location:resources!location_id(*), equipment:resources!equipment_id(*)')
      .eq('tenant_id', tenantId)
      .order('start_time', { ascending: true })

    if (error || !data) return []
    return (data as Record<string, unknown>[]).map(mapSlot)
  },

  async getSlotById(slotId: string): Promise<AvailabilitySlot | null> {
    const { data, error } = await supabase
      .from('availability_slots')
      .select('*, resource:resources!resource_id(*), staff:resources!staff_id(*), location:resources!location_id(*), equipment:resources!equipment_id(*)')
      .eq('id', slotId)
      .single()

    if (error || !data) return null
    return mapSlot(data as Record<string, unknown>)
  },

  async createSlot(input: CreateSlotInput): Promise<void> {
    const startTimestamp = new Date(`${input.date}T${input.startTime}:00`).toISOString()
    const endTimestamp   = new Date(`${input.date}T${input.endTime}:00`).toISOString()

    const { error } = await supabase.from('availability_slots').insert({
      tenant_id:    input.tenantId,
      resource_id:  input.resourceId  || null,
      staff_id:     input.staffId     || null,
      location_id:  input.locationId  || null,
      equipment_id: input.equipmentId || null,
      session_type: input.sessionType,
      start_time:   startTimestamp,
      end_time:     endTimestamp,
      capacity:     input.capacity,
      booked:       0,
    })

    if (error) throw new Error(error.message)
  },

  async deleteSlot(slotId: string): Promise<void> {
    const { error } = await supabase
      .from('availability_slots')
      .delete()
      .eq('id', slotId)

    if (error) throw new Error(error.message)
  },

  async getDistinctSessionTypes(tenantId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('availability_slots')
      .select('session_type')
      .eq('tenant_id', tenantId)

    if (error || !data) return []
    const types = (data as { session_type: string }[])
      .map((r) => r.session_type)
      .filter(Boolean)
    return [...new Set(types)].sort()
  },
}
