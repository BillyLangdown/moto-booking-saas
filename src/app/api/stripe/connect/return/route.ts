import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { tenantService } from '@/services/tenantService'
import { adminSupabase } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenant_id')
  const settingsUrl = new URL('/dashboard/settings?tab=Payments', req.url)

  if (!tenantId) return NextResponse.redirect(settingsUrl)

  try {
    const tenant = await tenantService.getTenantById(tenantId)

    if (tenant?.stripeAccountId) {
      await stripe.accounts.update(tenant.stripeAccountId, {
        capabilities: {
          card_payments: { requested: true },
          transfers:     { requested: true },
        },
      })
      const account = await stripe.accounts.retrieve(tenant.stripeAccountId)
      if (account.details_submitted || account.charges_enabled) {
        await adminSupabase
          .from('tenants')
          .update({ stripe_onboarded: true })
          .eq('id', tenantId)
      }
    }
  } catch (err) {
    console.error('[stripe/connect/return]', err)
  }

  // Always redirect back to settings - never 404
  return NextResponse.redirect(settingsUrl)
}
