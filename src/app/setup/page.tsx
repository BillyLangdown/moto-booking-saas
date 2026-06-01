import { getAuthTenant } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SetupWizard from '@/components/admin/SetupWizard'

export const dynamic = 'force-dynamic'

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tenant = await getAuthTenant()
  if (tenant.onboardingCompleted) redirect('/dashboard/bookings')

  return <SetupWizard tenant={tenant} userEmail={user?.email ?? ''} />
}
