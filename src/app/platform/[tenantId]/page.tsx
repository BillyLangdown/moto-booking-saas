import Link from 'next/link'
import { notFound } from 'next/navigation'
import { tenantService } from '@/services/tenantService'
import { resourceService } from '@/services/resourceService'
import { getTheme } from '@/lib/themes'
import ResourceManager from '@/components/platform/ResourceManager'

interface Props {
  params: Promise<{ tenantId: string }>
}

export default async function SchoolDetailPage({ params }: Props) {
  const { tenantId } = await params

  const [tenant, resources] = await Promise.all([
    tenantService.getTenantById(tenantId),
    resourceService.getResources(tenantId),
  ])

  if (!tenant) notFound()

  return (
    <div className="flex flex-col gap-8 max-w-2xl">

      {/* Back */}
      <Link href="/platform" className="flex items-center gap-1.5 text-sm text-secondary hover:text-ink transition-colors w-fit">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        All schools
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-white text-lg font-bold shrink-0"
          style={{ backgroundColor: getTheme(tenant.theme).primaryColor }}
        >
          {tenant.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-ink">{tenant.name}</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-sm text-secondary">{tenant.slug}</span>
            <Link
              href={`/book/${tenant.slug}`}
              target="_blank"
              className="text-xs text-accent hover:underline"
            >
              View booking page ↗
            </Link>
          </div>
        </div>
      </div>

      {/* School details */}
      <div className="rounded-xl border border-border bg-white divide-y divide-border">
        <div className="px-5 py-3 flex justify-between text-sm">
          <span className="text-secondary">Email</span>
          <span className="text-ink">{tenant.email || '—'}</span>
        </div>
        <div className="px-5 py-3 flex justify-between text-sm">
          <span className="text-secondary">Phone</span>
          <span className="text-ink">{tenant.phone || '—'}</span>
        </div>
        <div className="px-5 py-3 flex justify-between text-sm">
          <span className="text-secondary">Address</span>
          <span className="text-ink">{tenant.address || '—'}</span>
        </div>
        <div className="px-5 py-3 flex justify-between text-sm">
          <span className="text-secondary">Tenant ID</span>
          <span className="font-mono text-xs text-ink">{tenant.id}</span>
        </div>
        <div className="px-5 py-3 flex items-center justify-between">
          <span className="text-sm text-secondary">Theme</span>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: getTheme(tenant.theme).primaryColor }} />
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: getTheme(tenant.theme).accentColor }} />
            <span className="text-sm text-ink">{getTheme(tenant.theme).name}</span>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink">
          Instructors & bikes
          <span className="ml-2 text-secondary font-normal">{resources.length} total</span>
        </h2>
        <div className="rounded-xl border border-border bg-white p-5">
          <ResourceManager tenantId={tenantId} resources={resources} />
        </div>
      </div>

    </div>
  )
}
