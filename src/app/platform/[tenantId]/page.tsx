import { notFound } from 'next/navigation'
import { tenantService } from '@/services/tenantService'
import { resourceService } from '@/services/resourceService'
import { adminSupabase } from '@/lib/supabase/admin'
import BusinessDetailClient from '@/components/platform/BusinessDetailClient'

interface Props {
  params: Promise<{ tenantId: string }>
}

export default async function BusinessDetailPage({ params }: Props) {
  const { tenantId } = await params

  const [tenant, resources, { data: admins }] = await Promise.all([
    tenantService.getTenantById(tenantId),
    resourceService.getResources(tenantId),
    adminSupabase.from('users').select('id, email, role').eq('tenant_id', tenantId),
  ])

  if (!tenant) notFound()

  return <BusinessDetailClient tenant={tenant} resources={resources} admins={admins ?? []} />
}
