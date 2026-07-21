import { adminSupabase as supabase } from '@/lib/supabase/admin'
import type { BookingMode, IntakeQuestion, PaymentMode, SessionTypePrices, Tenant, UpdateTenantInput } from '@/types'

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
    autoConfirm: (b.auto_confirm as unknown as boolean) === true,
    branding: {
      primaryColor: b.primary_color ?? b.primaryColor ?? '#1e293b',
      accentColor:  b.accent_color  ?? b.accentColor  ?? '#f97316',
    },
    stripeAccountId:         (row.stripe_account_id           as string)       ?? undefined,
    stripeOnboarded:         (row.stripe_onboarded            as boolean)      ?? false,
    paymentMode:             ((row.payment_mode               as PaymentMode)  ?? 'none'),
    sessionTypePrices:       (row.session_type_prices         as SessionTypePrices) ?? {},
    currency:                (row.currency                    as string)       ?? 'gbp',
    showPricesOnBookingPage: (row.show_prices_on_booking_page as boolean)      ?? false,
    googleConnected:         (row.google_calendar_connected   as boolean)      ?? false,
    googleConnectedEmail:    (row.google_connected_email      as string)       ?? undefined,
    bookingMode:             ((row.booking_mode               as BookingMode)  ?? 'slotted'),
    orlaBusinessContext:     (row.orla_business_context       as string)       ?? undefined,
    orlaIntakePrompt:        (row.orla_intake_prompt          as string)       ?? undefined,
    generalAvailability:     (row.general_availability        as string)       ?? undefined,
    icalToken:               row.ical_token as string,
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

  async savePaymentSettings(id: string, opts: {
    paymentMode: PaymentMode
    sessionTypePrices: SessionTypePrices
    showPricesOnBookingPage: boolean
  }): Promise<void> {
    const { error } = await supabase
      .from('tenants')
      .update({
        payment_mode:                 opts.paymentMode,
        session_type_prices:          opts.sessionTypePrices,
        show_prices_on_booking_page:  opts.showPricesOnBookingPage,
      })
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
        auto_confirm:  input.autoConfirm === true,
        session_types: input.sessionTypes ?? null,
      },
    }

    if (input.intakeQuestions !== undefined) {
      updates.intake_questions = input.intakeQuestions
    }
    if (input.onboardingCompleted !== undefined) {
      updates.onboarding_completed = input.onboardingCompleted
    }
    if (input.bookingMode !== undefined) {
      updates.booking_mode = input.bookingMode
    }
    if (input.orlaBusinessContext !== undefined) {
      updates.orla_business_context = input.orlaBusinessContext
    }
    if (input.orlaIntakePrompt !== undefined) {
      updates.orla_intake_prompt = input.orlaIntakePrompt
    }
    if (input.generalAvailability !== undefined) {
      updates.general_availability = input.generalAvailability
    }

    const { error } = await supabase.from('tenants').update(updates).eq('id', id)
    if (error) throw new Error(error.message)
  },

  // Plain (non-server-action) deletion logic shared by the superadmin panel
  // and the mobile self-service "delete account" flow - each caller is
  // responsible for its own authorization check before calling this.
  async deleteTenantCascade(tenantId: string): Promise<{ error?: string }> {
    await supabase.from('bookings').delete().eq('tenant_id', tenantId)
    await supabase.from('availability_slots').delete().eq('tenant_id', tenantId)
    await supabase.from('resources').delete().eq('tenant_id', tenantId)

    const { data: users } = await supabase
      .from('users')
      .select('id, role')
      .eq('tenant_id', tenantId)
      .neq('role', 'superadmin')

    if (users?.length) {
      for (const u of users) {
        await supabase.auth.admin.deleteUser(u.id)
      }
    }

    await supabase.from('users').delete().eq('tenant_id', tenantId)

    const { error } = await supabase.from('tenants').delete().eq('id', tenantId)
    if (error) return { error: error.message }

    return {}
  },
}
