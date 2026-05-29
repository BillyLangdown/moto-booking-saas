import { availabilityService } from '@/services/availabilityService'
import AvailabilityList from '@/components/admin/AvailabilityList'

const DEMO_TENANT_ID = '7e72666f-53ac-4080-b27b-14073217bab4'

export default async function AvailabilityPage() {
  const slots = await availabilityService.getAllSlots(DEMO_TENANT_ID)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">Availability</h1>
        <p className="text-sm text-secondary mt-0.5">{slots.length} slots configured</p>
      </div>
      <AvailabilityList slots={slots} />
    </div>
  )
}
