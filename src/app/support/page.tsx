import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support - Orla',
  description: 'Get help with Orla booking and the Orla iOS app.',
}

const FAQS = [
  {
    q: "I can't sign in to the app or dashboard",
    a: 'Use the "Forgot password?" link on the sign-in screen (web or iOS) to get a reset link emailed to you. If you never received an invite email, check your spam folder or get in touch below.',
  },
  {
    q: 'A customer says they never got a confirmation email',
    a: "Ask them to check spam. If it's still missing, you can resend confirmation from the booking's detail view, or message the customer directly from there to sort it out.",
  },
  {
    q: 'How do I change my booking mode, working hours, or what Orla asks customers?',
    a: 'From Settings on the web dashboard, or Settings on the iOS app - both cover business info, booking mode, working hours, and what Ask Orla should collect for Open Enquiry.',
  },
  {
    q: 'I want to switch between Fixed slots and Open Enquiry',
    a: 'This is changed from Settings > Booking mode, on either the web dashboard or the iOS app. You can switch at any time.',
  },
]

export default function SupportPage() {
  return (
    <div className="min-h-dvh px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-secondary hover:text-ink">← Orla</Link>

        <h1 className="font-display mt-8 text-3xl font-bold tracking-tight sm:text-4xl">
          Support
        </h1>
        <p className="mt-4 text-secondary">
          Need a hand with the Orla web dashboard or the iOS app? Start with
          the questions below, or reach us directly.
        </p>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-medium text-ink">Contact us</p>
          <p className="mt-1.5 text-sm text-secondary">
            <a href="mailto:hello@orlabooking.com" className="text-accent hover:underline">
              hello@orlabooking.com
            </a>
            . We typically reply within one working day.
          </p>
        </div>

        <div className="mt-12 flex flex-col divide-y divide-border">
          {FAQS.map(f => (
            <div key={f.q} className="py-6 first:pt-0">
              <h2 className="text-base font-semibold text-ink">{f.q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-secondary">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
