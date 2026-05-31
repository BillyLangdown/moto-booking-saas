import Sidebar from '@/components/admin/Sidebar'
import MobileNav from '@/components/admin/MobileNav'
import { getAuthTenant } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Dashboard' }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getAuthTenant()
  if (!tenant.onboardingCompleted) redirect('/setup')

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar tenantName={tenant.name} tenantSlug={tenant.slug} />
      </div>

      {/* Main column */}
      <div className="flex flex-1 flex-col min-h-0">
        {/* Mobile: dark top bar with tenant name */}
        <div
          className="flex shrink-0 items-center gap-3 px-4 py-3 md:hidden"
          style={{ background: 'linear-gradient(180deg, #0D1117 0%, #1a2644 100%)' }}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded bg-white/10 text-white text-xs font-bold shrink-0">
            {tenant.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-sm text-white truncate">{tenant.name}</span>
        </div>

        {/* Mobile nav tabs */}
        <MobileNav />

        <main className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
