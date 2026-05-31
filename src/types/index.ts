export type TenantId = string

export type SessionType = string

export type ResourceType = 'person' | 'asset'

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled'

export interface IntakeQuestion {
  id: string
  type: 'text' | 'number' | 'dropdown' | 'yesno'
  label: string
  required: boolean
  options?: string[]
}

export interface Tenant {
  id: TenantId
  slug: string
  name: string
  description: string
  phone: string
  email: string
  address: string
  logoUrl?: string
  theme?: string
  intakeQuestions: IntakeQuestion[]
  sessionTypes: string[]
  onboardingCompleted: boolean
  autoConfirm: boolean
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
  sessionType: SessionType
  date: string
  startTime: string
  endTime: string
  capacity: number
  booked: number
}

export interface Booking {
  id: string
  tenantId: TenantId
  slotId: string
  slot?: Pick<AvailabilitySlot, 'date' | 'startTime' | 'endTime' | 'sessionType'>
  name: string
  email: string
  phone?: string
  notes?: string
  sessionType: SessionType
  intakeAnswers: Record<string, string>
  createdAt: string
  status: BookingStatus
  startTimeIso?: string
  endTimeIso?: string
  resourceName?: string
}

export interface CreateSlotInput {
  tenantId: TenantId
  resourceId: string
  sessionType: SessionType
  date: string
  startTime: string
  endTime: string
  capacity: number
}

export interface UpdateTenantInput {
  name: string
  email: string
  phone: string
  address: string
  description: string
  logoUrl?: string
  theme?: string
  intakeQuestions?: IntakeQuestion[]
  onboardingCompleted?: boolean
  autoConfirm?: boolean
  sessionTypes?: string[]
  primaryColor: string
  accentColor: string
}

export interface CreateBookingInput {
  tenantId: TenantId
  slotId: string
  resourceId: string
  name: string
  email: string
  phone?: string
  notes?: string
  sessionType: SessionType
  intakeAnswers: Record<string, string>
  startTime: string
  endTime: string
  status?: BookingStatus
}
