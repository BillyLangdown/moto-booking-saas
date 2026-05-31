import { notFound } from 'next/navigation'
import { tenantService } from '@/services/tenantService'
import { resourceService } from '@/services/resourceService'
import SchoolDetailClient from '@/components/platform/SchoolDetailClient'

interface Props {
  params: Promise<{ tenantId: string }>
}

export default async function SchoolDetailPage({ params }: Props) {
  const { tenantId } = await params

  const [tenant, resources] = await Promise.all([
    tenantService.getTenantById(tenantId),
    resourceService.getResources(tenantId),
  ])

  if (!tenant) notFound()

  return <SchoolDetailClient tenant={tenant} resources={resources} />
}
