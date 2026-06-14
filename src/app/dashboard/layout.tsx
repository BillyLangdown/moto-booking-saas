import Sidebar from '@/components/admin/Sidebar'
import TopBar from '@/components/admin/TopBar'
import { getAuthTenant } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Orla' }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getAuthTenant()
  if (!tenant.onboardingCompleted) redirect('/setup')

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — unchanged */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar tenantName={tenant.name} tenantSlug={tenant.slug} />
      </div>

      {/* Mobile: single top bar + slide-down nav drawer */}
      <TopBar tenantName={tenant.name} tenantSlug={tenant.slug} />

      {/* Main content — pt clears the 56px bar + breathing room */}
      <main className="flex-1 overflow-y-auto [scrollbar-gutter:stable] px-5 pt-[96px] pb-16 sm:px-7 md:p-8 lg:p-10">
        {children}
      </main>
    </div>
  )
}
