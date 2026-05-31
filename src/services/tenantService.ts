import { adminSupabase as supabase } from '@/lib/supabase/admin'
import type { IntakeQuestion, Tenant, UpdateTenantInput } from '@/types'

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
    logoUrl:     b.logo_url ?? undefined,
    theme:       b.theme ?? undefined,
    intakeQuestions: (row.intake_questions as IntakeQuestion[]) ?? [],
    sessionTypes: (b.session_types as unknown as string[]) ?? [],
    onboardingCompleted: (row.onboarding_completed as boolean) ?? false,
    autoConfirm: (b.auto_confirm as unknown as boolean) !== false,
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

  async updateIntakeQuestions(id: string, questions: IntakeQuestion[]): Promise<void> {
    const { error } = await supabase
      .from('tenants')
      .update({ intake_questions: questions })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async completeOnboarding(id: string): Promise<void> {
    const { error } = await supabase
      .from('tenants')
      .update({ onboarding_completed: true })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async updateTenant(id: string, input: UpdateTenantInput): Promise<void> {
    const updates: Record<string, unknown> = {
      name:        input.name,
      email:       input.email,
      phone:       input.phone,
      address:     input.address,
      description: input.description,
      branding: {
        primary_color: input.primaryColor,
        accent_color:  input.accentColor,
        logo_url:      input.logoUrl ?? null,
        theme:         input.theme ?? null,
        auto_confirm:  input.autoConfirm !== false,
        session_types: input.sessionTypes ?? null,
      },
    }

    if (input.intakeQuestions !== undefined) {
      updates.intake_questions = input.intakeQuestions
    }
    if (input.onboardingCompleted !== undefined) {
      updates.onboarding_completed = input.onboardingCompleted
    }

    const { error } = await supabase.from('tenants').update(updates).eq('id', id)
    if (error) throw new Error(error.message)
  },
}
