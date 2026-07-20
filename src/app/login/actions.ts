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

export async function requestPasswordResetAction(email: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  // Errors are intentionally swallowed (e.g. "user not found") so this can't
  // be used to check which emails have an account - the UI always shows the
  // same "check your email" confirmation either way.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=/reset-password`,
  })
  return {}
}

export async function completePasswordResetAction(password: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: updateError } = await supabase.auth.updateUser({ password })
  if (updateError) return { error: updateError.message }
  if (!user?.email) redirect('/login')

  const { data } = await adminSupabase
    .from('users')
    .select('role')
    .eq('email', user.email)
    .single()

  redirect(data?.role === 'superadmin' ? '/platform' : '/dashboard/bookings')
}
