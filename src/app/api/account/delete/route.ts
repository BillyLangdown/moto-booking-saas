import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { adminSupabase } from '@/lib/supabase/admin'
import { deleteBusinessAction } from '@/app/platform/actions'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const accessToken = authHeader.replace(/^bearer /i, '').trim()
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
  const { data: { user } } = await userClient.auth.getUser(accessToken)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow, error: userErr } = await adminSupabase
    .from('users').select('tenant_id').eq('id', user.id).single()
  if (userErr || !userRow?.tenant_id) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { error } = await deleteBusinessAction(userRow.tenant_id as string)
  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ success: true })
}
