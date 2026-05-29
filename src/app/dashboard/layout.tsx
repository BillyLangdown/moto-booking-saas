import Sidebar from '@/components/admin/Sidebar'

export const metadata = {
  title: 'Dashboard — BookMoto',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-subtle">
      {/* Sidebar — hidden on mobile, shown on md+ */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-white text-xs font-bold">
            B
          </div>
          <span className="font-semibold text-sm text-ink">BookMoto</span>
          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
            Demo
          </span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
