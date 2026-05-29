import { adminSupabase as supabase } from '@/lib/supabase/admin'
import type { Resource } from '@/types'

export const resourceService = {
  async getResources(tenantId: string): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name')
    if (error || !data) return []
    return (data as Record<string, unknown>[]).map((r) => ({
      id:       r.id as string,
      tenantId: r.tenant_id as string,
      name:     r.name as string,
      type:     r.type as 'instructor' | 'bike',
    }))
  },
}
