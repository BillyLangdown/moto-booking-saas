import { getAuthTenant } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SetupWizard from '@/components/admin/SetupWizard'

export const dynamic = 'force-dynamic'

export default async function SetupPage() {
  const tenant = await getAuthTenant()
  if (tenant.onboardingCompleted) redirect('/dashboard/bookings')

  return <SetupWizard tenant={tenant} />
}
