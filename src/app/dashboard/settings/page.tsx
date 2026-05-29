import { tenantService } from '@/services/tenantService'
import Card from '@/components/ui/Card'

const DEMO_TENANT_ID = '7e72666f-53ac-4080-b27b-14073217bab4'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between py-3 border-b border-border last:border-b-0">
      <span className="text-xs font-medium uppercase tracking-wide text-secondary">{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  )
}

export default async function SettingsPage() {
  const tenant = await tenantService.getTenantById(DEMO_TENANT_ID)
  if (!tenant) return <p className="text-sm text-secondary">Tenant not found.</p>

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-lg font-semibold text-ink">Settings</h1>
        <p className="text-sm text-secondary mt-0.5">Tenant configuration — read only in demo mode.</p>
      </div>

      <Card className="px-5 py-1">
        <Row label="Name" value={tenant.name} />
        <Row label="Slug" value={tenant.slug} />
        <Row label="Email" value={tenant.email} />
        <Row label="Phone" value={tenant.phone} />
        <Row label="Address" value={tenant.address} />
        <Row label="Tenant ID" value={tenant.id} />
      </Card>

      <div>
        <h2 className="text-sm font-semibold text-ink mb-3">Branding</h2>
        <Card className="px-5 py-1">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between py-3 border-b border-border">
            <span className="text-xs font-medium uppercase tracking-wide text-secondary">Primary colour</span>
            <div className="flex items-center gap-2">
              <div
                className="h-5 w-5 rounded border border-border"
                style={{ backgroundColor: tenant.branding.primaryColor }}
              />
              <span className="text-sm font-mono text-ink">{tenant.branding.primaryColor}</span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between py-3">
            <span className="text-xs font-medium uppercase tracking-wide text-secondary">Accent colour</span>
            <div className="flex items-center gap-2">
              <div
                className="h-5 w-5 rounded border border-border"
                style={{ backgroundColor: tenant.branding.accentColor }}
              />
              <span className="text-sm font-mono text-ink">{tenant.branding.accentColor}</span>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink mb-3">Description</h2>
        <Card className="p-5">
          <p className="text-sm text-secondary leading-relaxed">{tenant.description}</p>
        </Card>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-xs text-amber-700">
          <strong>Demo mode</strong> — Settings editing will be available once Supabase is connected.
        </p>
      </div>
    </div>
  )
}
