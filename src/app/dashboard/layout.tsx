import Sidebar from '@/components/admin/Sidebar'
import MobileNav from '@/components/admin/MobileNav'
import { getAuthTenant } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Dashboard — BookMoto',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getAuthTenant()
  if (!tenant.onboardingCompleted) redirect('/setup')

  return (
    <div className="flex h-screen overflow-hidden bg-subtle">
      <div className="hidden md:flex md:shrink-0">
        <Sidebar tenantName={tenant.name} tenantSlug={tenant.slug} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-white text-xs font-bold">
            B
          </div>
          <span className="font-semibold text-sm text-ink">{tenant.name}</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 sm:pb-6 lg:p-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
