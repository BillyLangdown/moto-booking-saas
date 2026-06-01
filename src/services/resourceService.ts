import { adminSupabase as supabase } from '@/lib/supabase/admin'
import type { Resource, ResourceType } from '@/types'

export const resourceService = {
  async deleteResource(resourceId: string): Promise<void> {
    const { error } = await supabase.from('resources').delete().eq('id', resourceId)
    if (error) throw new Error(error.message)
  },

  async createResource(tenantId: string, name: string, type: ResourceType): Promise<{ id: string }> {
    const { data, error } = await supabase
      .from('resources')
      .insert({ tenant_id: tenantId, name, type })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return { id: (data as Record<string, unknown>).id as string }
  },

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
      type:     r.type as ResourceType,
    }))
  },
}
