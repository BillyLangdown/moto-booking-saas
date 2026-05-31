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
              <li key={t.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center bg-ink/10 text-ink text-sm font-bold shrink-0">
                  {t.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-ink">{t.name}</p>
                  <p className="text-xs text-secondary mt-0.5">/book/{t.slug}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={`/book/${t.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-secondary hover:text-ink transition-colors hidden sm:block"
                  >
                    Booking page ↗
                  </a>
                  <Link
                    href={`/platform/${t.id}`}
                    className="px-3 py-1.5 text-xs font-medium bg-ink text-white hover:bg-ink/80 transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
