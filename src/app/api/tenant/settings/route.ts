import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { tenantService } from '@/services/tenantService'
import type { BookingMode } from '@/types'

interface SettingsBody {
  name?: string
  email?: string
  phone?: string
  address?: string
  description?: string
  bookingMode?: string
  autoConfirm?: boolean
  sessionTypes?: string[]
  orlaBusinessContext?: string
  orlaIntakePrompt?: string
  generalAvailability?: string
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const accessToken = authHeader.replace(/^bearer /i, '').trim()
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { authorization: `Bearer ${accessToken}` } } },
  )
  const { data: { user } } = await userClient.auth.getUser(accessToken)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenantId, error: tidErr } = await userClient.rpc('get_my_tenant_id')
  if (tidErr || !tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const current = await tenantService.getTenantById(tenantId as string)
  if (!current) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body = (await req.json()) as SettingsBody

  await tenantService.updateTenant(tenantId as string, {
    name:                body.name                ?? current.name,
    email:               body.email               ?? current.email,
    phone:               body.phone               ?? current.phone,
    address:             body.address             ?? current.address,
    description:         body.description         ?? current.description,
    primaryColor:        current.branding.primaryColor,
    accentColor:         current.branding.accentColor,
    logoUrl:             current.logoUrl,
    theme:               current.theme,
    autoConfirm:         body.autoConfirm         !== undefined ? body.autoConfirm : current.autoConfirm,
    sessionTypes:        body.sessionTypes        ?? current.sessionTypes,
    bookingMode:         (body.bookingMode        ?? current.bookingMode) as BookingMode,
    orlaBusinessContext: body.orlaBusinessContext ?? current.orlaBusinessContext,
    orlaIntakePrompt:    body.orlaIntakePrompt    ?? current.orlaIntakePrompt,
    generalAvailability: body.generalAvailability ?? current.generalAvailability,
  })

  const updated = await tenantService.getTenantById(tenantId as string)
  if (!updated) return NextResponse.json({ error: 'Failed to reload tenant' }, { status: 500 })

  // Return snake_case to match iOS Codable CodingKeys
  return NextResponse.json({
    id:                    updated.id,
    slug:                  updated.slug,
    name:                  updated.name,
    email:                 updated.email,
    phone:                 updated.phone,
    address:               updated.address,
    description:           updated.description,
    auto_confirm:          updated.autoConfirm,
    onboarding_completed:  updated.onboardingCompleted,
    session_types:         updated.sessionTypes,
    payment_mode:          updated.paymentMode,
    stripe_onboarded:      updated.stripeOnboarded,
    google_connected:      updated.googleConnected,
    google_connected_email: updated.googleConnectedEmail,
    booking_mode:          updated.bookingMode,
    general_availability:  updated.generalAvailability,
    orla_business_context: updated.orlaBusinessContext,
    orla_intake_prompt:    updated.orlaIntakePrompt,
    ical_token:            updated.icalToken,
  })
}
