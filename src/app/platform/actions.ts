'use server'

import { revalidatePath } from 'next/cache'
import { adminSupabase } from '@/lib/supabase/admin'

interface CreateBusinessInput {
  name: string
  slug: string
  email: string
  phone: string
  address: string
  description: string
  theme: string
  primaryColor: string
  accentColor: string
  adminEmail: string
}

export async function createBusinessAction(
  input: CreateBusinessInput,
): Promise<{ error?: string; tenantId?: string }> {
  // 1. Create tenant
  const { data: tenant, error: tenantError } = await adminSupabase
    .from('tenants')
    .insert({
      name:        input.name,
      slug:        input.slug,
      email:       input.email,
      phone:       input.phone,
      address:     input.address,
      description: input.description,
      branding: {
        theme:         input.theme,
        primary_color: input.primaryColor,
        accent_color:  input.accentColor,
      },
    })
    .select()
    .single()

  if (tenantError) return { error: tenantError.message }

  // 2. Invite admin — sends email with link that lands on /setup to set password
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const { data: authData, error: authError } = await adminSupabase.auth.admin.inviteUserByEmail(
    input.adminEmail,
    { redirectTo: `${baseUrl}/auth/callback?next=/setup` },
  )

  if (authError) {
    await adminSupabase.from('tenants').delete().eq('id', tenant.id)
    return { error: authError.message }
  }

  // 3. Link auth user to tenant in the users table
  const { error: userError } = await adminSupabase.from('users').insert({
    id:        authData.user.id,
    tenant_id: tenant.id,
    email:     input.adminEmail,
    role:      'admin',
  })

  if (userError) {
    await adminSupabase.auth.admin.deleteUser(authData.user.id)
    await adminSupabase.from('tenants').delete().eq('id', tenant.id)
    return { error: userError.message }
  }

  revalidatePath('/platform')
  return { tenantId: tenant.id }
}

export async function createResourceAction(
  tenantId: string,
  name: string,
  type: string,
): Promise<{ error?: string }> {
  const { error } = await adminSupabase
    .from('resources')
    .insert({ tenant_id: tenantId, name, type })

  if (error) return { error: error.message }
  revalidatePath(`/platform/${tenantId}`)
  return {}
}

export async function deleteResourceAction(
  resourceId: string,
  tenantId: string,
): Promise<void> {
  await adminSupabase.from('resources').delete().eq('id', resourceId)
  revalidatePath(`/platform/${tenantId}`)
}
