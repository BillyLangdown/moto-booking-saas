import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { adminSupabase } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.replace(/^bearer /i, '').trim()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { global: { headers: { authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const deviceToken: string = body?.token ?? ''
    const tenantId: string    = body?.tenantId ?? ''

    if (!deviceToken || !tenantId) {
      return NextResponse.json({ error: 'token and tenantId required' }, { status: 400 })
    }

    // Upsert so re-registrations don't duplicate rows
    const { error } = await adminSupabase
      .from('device_tokens')
      .upsert(
        { user_id: user.id, tenant_id: tenantId, token: deviceToken },
        { onConflict: 'user_id,token' }
      )

    if (error) {
      console.error('[notifications/register]', error)
      return NextResponse.json({ error: 'Failed to register token' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notifications/register]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
