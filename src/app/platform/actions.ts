'use server'

import { revalidatePath } from 'next/cache'
import { adminSupabase } from '@/lib/supabase/admin'
import { createClient } from '@/utils/supabase/server'

// Server Actions are callable directly as their own endpoints once deployed -
// the /platform layout's getAuthSuperAdmin() redirect only protects the page,
// not the action itself. Every exported action here must check this first.
async function requireSuperAdmin(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return 'Not authorized'

  const { data } = await adminSupabase
    .from('users')
    .select('role')
    .eq('email', user.email)
    .single()

  return data?.role === 'superadmin' ? null : 'Not authorized'
}

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
  const authCheckError = await requireSuperAdmin()
  if (authCheckError) return { error: authCheckError }

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

  // 2. Invite admin - sends email with link that lands on /setup to set password
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const { data: authData, error: authError } = await adminSupabase.auth.admin.inviteUserByEmail(
    input.adminEmail,
    { redirectTo: `${baseUrl}/auth/callback?next=/setup` },
  )

  if (authError) {
    console.error('[inviteUserByEmail] error:', JSON.stringify(authError), 'redirectTo:', `${baseUrl}/auth/callback?next=/setup`)
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

// Invite links expire 24h after being sent (see the "Invite user" Supabase
// email template) and there was previously no way to send a new one without
// re-running createBusinessAction, which would create a duplicate tenant.
// This re-issues a fresh invite for an existing tenant admin: drop the stale
// auth user + users-table row for this email (if any), send a brand new
// invite, and re-link it to the same tenant with the same role.
export async function resendInviteAction(
  tenantId: string,
  email: string,
): Promise<{ error?: string }> {
  const authCheckError = await requireSuperAdmin()
  if (authCheckError) return { error: authCheckError }

  const { data: existing } = await adminSupabase
    .from('users')
    .select('id, role')
    .eq('tenant_id', tenantId)
    .eq('email', email)
    .maybeSingle()

  const role = existing?.role ?? 'admin'

  if (existing?.id) {
    await adminSupabase.auth.admin.deleteUser(existing.id)
    await adminSupabase.from('users').delete().eq('id', existing.id)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const { data: authData, error: authError } = await adminSupabase.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${baseUrl}/auth/callback?next=/setup` },
  )

  if (authError) return { error: authError.message }

  const { error: userError } = await adminSupabase.from('users').insert({
    id:        authData.user.id,
    tenant_id: tenantId,
    email,
    role,
  })

  if (userError) {
    await adminSupabase.auth.admin.deleteUser(authData.user.id)
    return { error: userError.message }
  }

  revalidatePath(`/platform/${tenantId}`)
  return {}
}

export async function createResourceAction(
  tenantId: string,
  name: string,
  type: string,
): Promise<{ error?: string }> {
  const authCheckError = await requireSuperAdmin()
  if (authCheckError) return { error: authCheckError }

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
  if (await requireSuperAdmin()) return

  await adminSupabase.from('resources').delete().eq('id', resourceId)
  revalidatePath(`/platform/${tenantId}`)
}

export async function deleteBusinessAction(
  tenantId: string,
): Promise<{ error?: string }> {
  const authCheckError = await requireSuperAdmin()
  if (authCheckError) return { error: authCheckError }

  // Delete child records first to avoid FK constraint errors
  await adminSupabase.from('bookings').delete().eq('tenant_id', tenantId)
  await adminSupabase.from('availability_slots').delete().eq('tenant_id', tenantId)
  await adminSupabase.from('resources').delete().eq('tenant_id', tenantId)

  // Fetch and delete auth users linked to this tenant (never touch superadmins)
  const { data: users } = await adminSupabase
    .from('users')
    .select('id, role')
    .eq('tenant_id', tenantId)
    .neq('role', 'superadmin')

  if (users?.length) {
    for (const u of users) {
      await adminSupabase.auth.admin.deleteUser(u.id)
    }
  }

  await adminSupabase.from('users').delete().eq('tenant_id', tenantId)

  const { error } = await adminSupabase.from('tenants').delete().eq('id', tenantId)
  if (error) return { error: error.message }

  revalidatePath('/platform')
  return {}
}
