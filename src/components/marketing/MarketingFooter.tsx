import Link from 'next/link'

export default function MarketingFooter() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2.5">
          <img src="/images/orla_booking_logo_light.png" alt="Orla" className="h-5 w-auto object-contain opacity-80" />
        </div>
        <p className="text-xs text-muted">© {new Date().getFullYear()} Orla. All rights reserved.</p>
        <div className="flex items-center gap-6 text-xs text-secondary">
          <Link href="/support" className="hover:text-ink">Support</Link>
          <Link href="/login" className="hover:text-ink">Sign in</Link>
          <a href="mailto:hello@orlabooking.com" className="hover:text-ink">hello@orlabooking.com</a>
        </div>
      </div>
    </footer>
  )
}
