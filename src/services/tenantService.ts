import { createClient } from '@supabase/supabase-js'
import type { Tenant } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
)

// Map DB row → Tenant type.
// branding is stored as JSONB. Handles both snake_case and camelCase keys.
function mapTenant(row: Record<string, unknown>): Tenant {
  const b = (row.branding ?? {}) as Record<string, string>
  return {
    id:          row.id as string,
    slug:        row.slug as string,
    name:        row.name as string,
    description: (row.description as string) ?? '',
    phone:       (row.phone as string) ?? '',
    email:       (row.email as string) ?? '',
    address:     (row.address as string) ?? '',
    branding: {
      primaryColor: b.primary_color ?? b.primaryColor ?? '#1e293b',
      accentColor:  b.accent_color  ?? b.accentColor  ?? '#f97316',
    },
  }
}

export const tenantService = {
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single()
    if (error || !data) return null
    return mapTenant(data as Record<string, unknown>)
  },

  async getTenantById(id: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return mapTenant(data as Record<string, unknown>)
  },

  async getAllTenants(): Promise<Tenant[]> {
    const { data, error } = await supabase.from('tenants').select('*')
    if (error || !data) return []
    return (data as Record<string, unknown>[]).map(mapTenant)
  },
}
