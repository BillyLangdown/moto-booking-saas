import Link from 'next/link'
import { getAuthSuperAdmin } from '@/lib/auth'
import { signOutAction } from '@/app/login/actions'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Super Admin — Slick' }

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await getAuthSuperAdmin()

  return (
    <div className="min-h-dvh flex flex-col">
      <header style={{ background: 'linear-gradient(180deg, #0D1117 0%, #1a2644 100%)' }}>
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-6">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center bg-white/10 text-white text-xs font-bold">
              S
            </div>
            <span className="font-semibold text-sm text-white">Super Admin</span>
          </div>

          <nav className="flex items-center gap-4 flex-1">
            <Link href="/platform" className="text-sm text-white/60 hover:text-white transition-colors">
              Businesses
            </Link>
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <Link href="/dashboard/bookings" className="text-xs text-white/50 hover:text-white transition-colors">
              Your dashboard
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="text-xs text-white/50 hover:text-rose-400 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 flex-1">
        {children}
      </main>
    </div>
  )
}
