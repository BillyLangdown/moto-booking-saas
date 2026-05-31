import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { tenantService } from '@/services/tenantService'
import { availabilityService } from '@/services/availabilityService'
import BookingPageClient from '@/components/booking/BookingPageClient'

interface Props {
  params: Promise<{ tenant: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant: slug } = await params
  const tenant = await tenantService.getTenantBySlug(slug)
  if (!tenant) return {}
  return {
    title: `Book — ${tenant.name}`,
    description: tenant.description,
  }
}

export default async function BookingPage({ params }: Props) {
  const { tenant: slug } = await params

  const tenant = await tenantService.getTenantBySlug(slug)
  if (!tenant) notFound()

  const allSlots = await availabilityService.getSlots(tenant.id)
  const configuredTypes = tenant.sessionTypes ?? []
  const slots = configuredTypes.length > 0
    ? allSlots.filter((s) => configuredTypes.includes(s.sessionType))
    : allSlots

  return <BookingPageClient tenant={tenant} slots={slots} />
}
