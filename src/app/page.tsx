import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-8">
      <div className="flex flex-col gap-3 max-w-sm">
        <div className="flex justify-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-white font-bold text-xl">
            B
          </span>
        </div>
        <h1 className="text-3xl font-bold text-ink">BookMoto</h1>
        <p className="text-secondary text-sm leading-relaxed">
          Multi-tenant booking platform for motorcycle training schools.
          Frontend prototype — no backend yet.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          href="/book/southern-moto-school"
          className="flex-1 text-center rounded-lg bg-accent text-white text-sm font-medium px-4 py-2.5 hover:bg-accent-hover transition-colors"
        >
          Demo booking page
        </Link>
        <Link
          href="/dashboard/bookings"
          className="flex-1 text-center rounded-lg border border-border bg-white text-ink text-sm font-medium px-4 py-2.5 hover:bg-subtle transition-colors"
        >
          Admin dashboard
        </Link>
      </div>

      <p className="text-xs text-muted">
        Tenant slug: <code className="font-mono bg-white border border-border rounded px-1 py-0.5">southern-moto-school</code>
      </p>
    </main>
  )
}
