import type { Tenant, Resource, AvailabilitySlot, Booking } from '@/types'

// ─── Tenants ─────────────────────────────────────────────────────────────────

export const mockTenants: Tenant[] = [
  {
    id: 'tenant_001',
    slug: 'southern-moto-school',
    name: 'Southern Moto School',
    description:
      'Professional motorcycle training in Brighton & Hove. CBT, A1/A2, and full Direct Access courses.',
    phone: '01273 567890',
    email: 'info@southernmotoschool.co.uk',
    address: '45 Riding Lane, Brighton, BN1 2AB',
    branding: {
      primaryColor: '#1e293b',
      accentColor: '#f97316',
    },
    intakeQuestions: [],
    onboardingCompleted: true,
  },
]

// ─── Resources ───────────────────────────────────────────────────────────────

export const mockResources: Resource[] = [
  { id: 'res_001', tenantId: 'tenant_001', name: 'Dave Thornton', type: 'instructor' },
  { id: 'res_002', tenantId: 'tenant_001', name: 'Sarah Okafor', type: 'instructor' },
  { id: 'res_003', tenantId: 'tenant_001', name: 'Honda CB500F — BN21 XYZ', type: 'bike' },
  { id: 'res_004', tenantId: 'tenant_001', name: 'Yamaha MT-07 — BN22 ABC', type: 'bike' },
]

// ─── Availability Slots ───────────────────────────────────────────────────────
// Dates are relative to today so the demo always shows upcoming slots.

function dateFromNow(daysAhead: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().split('T')[0]
}

export const mockSlots: AvailabilitySlot[] = [
  {
    id: 'slot_001',
    tenantId: 'tenant_001',
    resourceId: 'res_001',
    resource: { id: 'res_001', tenantId: 'tenant_001', name: 'Dave Thornton', type: 'instructor' },
    licenceType: 'CBT',
    date: dateFromNow(1),
    startTime: '08:00',
    endTime: '17:00',
    capacity: 3,
    booked: 1,
  },
  {
    id: 'slot_002',
    tenantId: 'tenant_001',
    resourceId: 'res_002',
    resource: { id: 'res_002', tenantId: 'tenant_001', name: 'Sarah Okafor', type: 'instructor' },
    licenceType: 'CBT',
    date: dateFromNow(1),
    startTime: '08:00',
    endTime: '17:00',
    capacity: 3,
    booked: 0,
  },
  {
    id: 'slot_003',
    tenantId: 'tenant_001',
    resourceId: 'res_001',
    resource: { id: 'res_001', tenantId: 'tenant_001', name: 'Dave Thornton', type: 'instructor' },
    licenceType: 'A1',
    date: dateFromNow(2),
    startTime: '09:00',
    endTime: '13:00',
    capacity: 2,
    booked: 0,
  },
  {
    id: 'slot_004',
    tenantId: 'tenant_001',
    resourceId: 'res_002',
    resource: { id: 'res_002', tenantId: 'tenant_001', name: 'Sarah Okafor', type: 'instructor' },
    licenceType: 'A2',
    date: dateFromNow(3),
    startTime: '10:00',
    endTime: '14:00',
    capacity: 2,
    booked: 1,
  },
  {
    id: 'slot_005',
    tenantId: 'tenant_001',
    resourceId: 'res_001',
    resource: { id: 'res_001', tenantId: 'tenant_001', name: 'Dave Thornton', type: 'instructor' },
    licenceType: 'DAS',
    date: dateFromNow(4),
    startTime: '09:00',
    endTime: '17:00',
    capacity: 1,
    booked: 0,
  },
  {
    id: 'slot_006',
    tenantId: 'tenant_001',
    resourceId: 'res_002',
    resource: { id: 'res_002', tenantId: 'tenant_001', name: 'Sarah Okafor', type: 'instructor' },
    licenceType: 'Refresher',
    date: dateFromNow(5),
    startTime: '13:00',
    endTime: '17:00',
    capacity: 2,
    booked: 0,
  },
  {
    id: 'slot_007',
    tenantId: 'tenant_001',
    resourceId: 'res_001',
    resource: { id: 'res_001', tenantId: 'tenant_001', name: 'Dave Thornton', type: 'instructor' },
    licenceType: 'A2',
    date: dateFromNow(6),
    startTime: '09:00',
    endTime: '13:00',
    capacity: 2,
    booked: 0,
  },
  {
    id: 'slot_008',
    tenantId: 'tenant_001',
    resourceId: 'res_002',
    resource: { id: 'res_002', tenantId: 'tenant_001', name: 'Sarah Okafor', type: 'instructor' },
    licenceType: 'DAS',
    date: dateFromNow(7),
    startTime: '09:00',
    endTime: '17:00',
    capacity: 1,
    booked: 0,
  },
]

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const mockBookings: Booking[] = [
  {
    id: 'booking_001',
    tenantId: 'tenant_001',
    slotId: 'slot_001',
    name: 'James Carter',
    email: 'james.carter@email.com',
    licenceType: 'CBT',
    notes: 'Never ridden before. Coming from a bicycle background.',
    intakeAnswers: {},
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed',
  },
  {
    id: 'booking_002',
    tenantId: 'tenant_001',
    slotId: 'slot_004',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    licenceType: 'A2',
    intakeAnswers: {},
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed',
  },
]
