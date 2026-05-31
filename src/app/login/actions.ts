'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'

export async function signInAction(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email:    formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  if (!user?.email) return { error: 'Sign in failed. Please try again.' }

  const { data } = await adminSupabase
    .from('users')
    .select('role')
    .eq('email', user.email)
    .single()

  redirect(data?.role === 'superadmin' ? '/platform' : '/dashboard/bookings')
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
