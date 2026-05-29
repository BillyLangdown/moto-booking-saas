import Link from 'next/link'
import { getAuthSuperAdmin } from '@/lib/auth'
import { signOutAction } from '@/app/login/actions'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Super Admin — BookMoto' }

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await getAuthSuperAdmin()

  return (
    <div className="min-h-screen bg-subtle">
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-6">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-white text-xs font-bold">
              B
            </div>
            <span className="font-semibold text-sm text-ink">Super Admin</span>
          </div>

          <nav className="flex items-center gap-4 flex-1">
            <Link href="/superadmin" className="text-sm text-secondary hover:text-ink transition-colors">
              Schools
            </Link>
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <Link href="/dashboard/bookings" className="text-xs text-secondary hover:text-ink transition-colors">
              Your dashboard
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="text-xs text-secondary hover:text-rose-600 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
