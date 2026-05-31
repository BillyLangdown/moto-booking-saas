import Sidebar from '@/components/admin/Sidebar'
import MobileNav from '@/components/admin/MobileNav'
import { getAuthTenant } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Dashboard' }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getAuthTenant()
  if (!tenant.onboardingCompleted) redirect('/setup')

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar tenantName={tenant.name} tenantSlug={tenant.slug} />
      </div>

      {/* Mobile fixed header + nav — pinned to viewport, outside content flow */}
      <div
        className="fixed top-0 inset-x-0 z-50 flex flex-col md:hidden"
        style={{ background: 'linear-gradient(180deg, #0D1117 0%, #1a2644 100%)' }}
      >
        <div className="flex h-12 shrink-0 items-center gap-3 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-white/10 text-white text-xs font-bold shrink-0">
            {tenant.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-sm text-white truncate">{tenant.name}</span>
        </div>
        <MobileNav />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto [scrollbar-gutter:stable] p-5 sm:p-7 lg:p-8 pt-28 md:pt-5 sm:md:pt-7 lg:md:pt-8">
        {children}
      </main>
    </div>
  )
}
