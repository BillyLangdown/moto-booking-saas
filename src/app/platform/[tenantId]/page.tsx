import { notFound } from 'next/navigation'
import { tenantService } from '@/services/tenantService'
import { resourceService } from '@/services/resourceService'
import BusinessDetailClient from '@/components/platform/BusinessDetailClient'

interface Props {
  params: Promise<{ tenantId: string }>
}

export default async function BusinessDetailPage({ params }: Props) {
  const { tenantId } = await params

  const [tenant, resources] = await Promise.all([
    tenantService.getTenantById(tenantId),
    resourceService.getResources(tenantId),
  ])

  if (!tenant) notFound()

  return <BusinessDetailClient tenant={tenant} resources={resources} />
}
