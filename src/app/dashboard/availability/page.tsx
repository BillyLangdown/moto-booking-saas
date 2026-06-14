import { availabilityService } from '@/services/availabilityService'
import { resourceService } from '@/services/resourceService'
import { getAuthTenant } from '@/lib/auth'
import AvailabilityView from '@/components/admin/AvailabilityView'

export default async function AvailabilityPage() {
  const tenant = await getAuthTenant()
  const [slots, resources] = await Promise.all([
    availabilityService.getAllSlots(tenant.id),
    resourceService.getResources(tenant.id),
  ])
  return (
    <AvailabilityView
      slots={slots}
      tenantId={tenant.id}
      resources={resources}
      sessionTypes={tenant.sessionTypes}
    />
  )
}
