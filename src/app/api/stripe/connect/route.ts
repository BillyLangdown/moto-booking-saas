import { NextRequest, NextResponse } from 'next/server'
import { stripe, createConnectAccountLink } from '@/lib/stripe'
import { tenantService } from '@/services/tenantService'
import { adminSupabase } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await req.json()
    if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 })

    const tenant = await tenantService.getTenantById(tenantId)
    if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin

    let accountId = tenant.stripeAccountId
    if (!accountId) {
      const account = await stripe.accounts.create({
        controller: {
          stripe_dashboard: { type: 'express' },
          fees:             { payer: 'application' },
          losses:           { payments: 'application' },
        },
        capabilities: {
          card_payments: { requested: true },
          transfers:     { requested: true },
        },
        ...(tenant.email ? { email: tenant.email } : {}),
        metadata: { tenant_id: tenantId },
      })
      accountId = account.id
      await adminSupabase
        .from('tenants')
        .update({ stripe_account_id: accountId })
        .eq('id', tenantId)
    } else {
      await stripe.accounts.update(accountId, {
        capabilities: {
          card_payments: { requested: true },
          transfers:     { requested: true },
        },
      })
    }

    const url = await createConnectAccountLink(accountId, tenantId, appUrl)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[stripe/connect]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Stripe error' },
      { status: 500 },
    )
  }
}
