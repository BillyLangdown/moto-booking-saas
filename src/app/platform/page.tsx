import Link from 'next/link'
import { tenantService } from '@/services/tenantService'

export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const tenants = await tenantService.getAllTenants()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Businesses</h1>
          <p className="text-sm text-secondary mt-0.5">{tenants.length} organisation{tenants.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/platform/new"
          className="inline-flex items-center gap-1.5 bg-ink text-white px-3 py-1.5 text-sm font-medium hover:bg-ink/80 transition-colors"
        >
          + Add business
        </Link>
      </div>

      <div className="bg-white shadow-sm">
        {tenants.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-secondary">No businesses yet.</p>
            <Link href="/platform/new" className="mt-3 inline-block text-sm text-accent hover:underline">
              Add your first business
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {tenants.map((t) => (
              <li key={t.id} className="relative group hover:bg-subtle transition-colors">
                <Link href={`/platform/${t.id}`} className="absolute inset-0" aria-label={t.name} />
                <div className="relative flex items-center gap-4 px-5 py-4">
                  <div className="flex h-9 w-9 items-center justify-center bg-ink/10 text-ink text-sm font-bold shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-ink">{t.name}</p>
                    <p className="text-xs text-secondary mt-0.5">/book/{t.slug}</p>
                  </div>
                  <div className="relative z-10 flex items-center gap-4 shrink-0">
                    {t.email && <span className="text-xs text-secondary hidden sm:block">{t.email}</span>}
                    <a
                      href={`/book/${t.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline hidden sm:block"
                    >
                      Booking page ↗
                    </a>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-secondary group-hover:text-ink transition-colors" aria-hidden="true">
                      <path d="M5 2.5L9 7l-4 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
