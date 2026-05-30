import Sidebar from '@/components/admin/Sidebar'
import MobileNav from '@/components/admin/MobileNav'
import { getAuthTenant } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Dashboard',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getAuthTenant()
  if (!tenant.onboardingCompleted) redirect('/setup')

  return (
    <div className="flex h-screen overflow-hidden bg-subtle">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar tenantName={tenant.name} tenantSlug={tenant.slug} />
      </div>

      {/* Main column — mobile nav lives here as a flex item, not fixed */}
      <div className="flex flex-1 flex-col min-h-0">
        {/* Mobile top bar */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-white px-4 py-3 md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-white text-xs font-bold shrink-0">
            {tenant.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-sm text-ink truncate">{tenant.name}</span>
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Mobile bottom nav — part of the flex column, always visible */}
        <MobileNav />
      </div>
    </div>
  )
}
