import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await adminSupabase
    .from('users')
    .select('role')
    .eq('email', user.email!)
    .single()

  redirect(data?.role === 'superadmin' ? '/platform' : '/dashboard/bookings')
}
