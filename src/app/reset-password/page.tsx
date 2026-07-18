import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ResetPasswordForm from './ResetPasswordForm'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <ResetPasswordForm />
}
