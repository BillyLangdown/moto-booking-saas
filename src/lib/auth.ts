import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { tenantService } from '@/services/tenantService'
import type { Tenant } from '@/types'

export const getAuthSuperAdmin = cache(async (): Promise<void> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) redirect('/login')

  const { data, error } = await adminSupabase
    .from('users')
    .select('role')
    .eq('email', user.email)
    .single()

  if (error) {
    console.error('[getAuthSuperAdmin] users query error:', error.message, 'email:', user.email)
  }

  if (data?.role !== 'superadmin') redirect('/dashboard/bookings')
})

// cache() deduplicates across layout + page in the same request
export const getAuthTenant = cache(async (): Promise<Tenant> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) redirect('/login')

  const { data } = await adminSupabase
    .from('users')
    .select('tenant_id')
    .eq('email', user.email)
    .single()

  if (!data?.tenant_id) redirect('/login')

  const tenant = await tenantService.getTenantById(data.tenant_id)
  if (!tenant) redirect('/login')

  return tenant
})
