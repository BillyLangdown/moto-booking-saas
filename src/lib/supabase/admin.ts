import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS, server-side only.
// Never import this in client components or pages marked 'use client'.
export const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
