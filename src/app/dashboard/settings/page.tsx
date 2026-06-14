import { getAuthTenant } from '@/lib/auth'
import { availabilityService } from '@/services/availabilityService'
import { resourceService } from '@/services/resourceService'
import SettingsForm from '@/components/admin/SettingsForm'

export default async function SettingsPage() {
  const tenant = await getAuthTenant()
  const [slotSessionTypes, resources] = await Promise.all([
    availabilityService.getDistinctSessionTypes(tenant.id),
    resourceService.getResources(tenant.id),
  ])
  return <SettingsForm tenant={tenant} slotSessionTypes={slotSessionTypes} resources={resources} />
}
