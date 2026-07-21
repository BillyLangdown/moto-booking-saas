import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { bookingService } from '@/services/bookingService'
import { tenantService } from '@/services/tenantService'
import { sendCustomMessage } from '@/lib/email'

// Mobile-only: lets an admin email a booking's customer directly (e.g. to
// ask for more detail on an Open Enquiry) without confirming or declining it.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const authHeader = req.headers.get('authorization') ?? ''
  const accessToken = authHeader.replace(/^bearer /i, '').trim()
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { authorization: `Bearer ${accessToken}` } } }
  )
  const { data: { user } } = await userClient.auth.getUser(accessToken)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenantId, error: tidErr } = await userClient.rpc('get_my_tenant_id')
  if (tidErr || !tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  let message: string
  try {
    const body = await req.json() as { message?: string }
    message = body?.message?.trim() ?? ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

  try {
    const booking = await bookingService.getBookingById(id)
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.tenantId !== tenantId) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (!booking.email) return NextResponse.json({ error: 'This booking has no customer email on file' }, { status: 400 })

    const tenant = await tenantService.getTenantById(booking.tenantId)
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    await sendCustomMessage(booking, tenant, message)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[booking/message POST]', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
