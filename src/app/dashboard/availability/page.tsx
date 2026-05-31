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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Availability</h1>
        <p className="text-sm text-secondary mt-0.5">
          {slots.length > 0 ? `${slots.length} slot${slots.length !== 1 ? 's' : ''} scheduled` : 'No slots yet — add your first below.'}
        </p>
      </div>
      <AvailabilityView
        slots={slots}
        tenantId={tenant.id}
        resources={resources}
        sessionTypes={tenant.sessionTypes}
      />
    </div>
  )
}
