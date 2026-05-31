import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await adminSupabase
    .from('users').select('tenant_id').eq('email', user.email).single()
  if (!userData?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'File must be JPEG, PNG, WebP or SVG' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${userData.tenant_id}/logo-${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error } = await adminSupabase.storage
    .from('logos')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = adminSupabase.storage.from('logos').getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
