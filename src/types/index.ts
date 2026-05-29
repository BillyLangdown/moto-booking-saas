export type TenantId = string

export type LicenceType = 'CBT' | 'A1' | 'A2' | 'DAS' | 'Refresher'

export type ResourceType = 'instructor' | 'bike'

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled'

export interface Tenant {
  id: TenantId
  slug: string
  name: string
  description: string
  phone: string
  email: string
  address: string
  branding: {
    primaryColor: string
    accentColor: string
  }
}

export interface Resource {
  id: string
  tenantId: TenantId
  name: string
  type: ResourceType
}

export interface AvailabilitySlot {
  id: string
  tenantId: TenantId
  resourceId: string
  resource: Resource
  licenceType: LicenceType
  date: string       // ISO date yyyy-mm-dd
  startTime: string  // HH:mm
  endTime: string    // HH:mm
  capacity: number
  booked: number
}

export interface Booking {
  id: string
  tenantId: TenantId
  slotId: string
  slot?: AvailabilitySlot
  name: string
  email: string
  notes?: string
  licenceType: LicenceType
  createdAt: string  // ISO datetime
  status: BookingStatus
}

export interface CreateBookingInput {
  tenantId: TenantId
  slotId: string
  resourceId: string
  name: string
  email: string
  notes?: string
  licenceType: LicenceType
  startTime: string  // ISO timestamp from the slot
  endTime: string    // ISO timestamp from the slot
}
