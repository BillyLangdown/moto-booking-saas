import Reveal from './Reveal'

export default function MarketingCTA() {
  return (
    <section id="cta" className="mx-auto max-w-4xl px-6 py-28 text-center">
      <Reveal>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Ready to run bookings
          <br />the calm way?
        </h2>
        <p className="mx-auto mt-5 max-w-md text-secondary">
          Get in touch and we&apos;ll set your business up with a booking page,
          your own login, and Ask Orla ready to go.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="mailto:hello@orlabooking.com"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Get Orla for your business
          </a>
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-medium text-secondary transition-colors hover:text-ink"
          >
            Sign in
          </a>
        </div>
      </Reveal>
    </section>
  )
}
