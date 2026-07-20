import Reveal from './Reveal'

const FEATURES = [
  {
    title: 'Your own booking page',
    body: 'A branded page at your own link with your services, availability, and prices. Customers book without emailing back and forth.',
    icon: (
      <path d="M4 4h16v16H4z M4 9h16 M9 4v16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    title: 'Fixed slots or open enquiry',
    body: 'Run pre-set time slots for appointments and classes, or switch to Open Enquiry so customers describe what they need.',
    icon: (
      <path d="M12 6v6l4 2 M12 21a9 9 0 100-18 9 9 0 000 18z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    title: 'Ask Orla, your AI receptionist',
    body: 'For custom or project-based work, Orla chats with customers, checks your schedule, and sends you a clear request to confirm or decline.',
    icon: (
      <path d="M9 2h6a3 3 0 013 3v10a3 3 0 01-3 3H9a3 3 0 01-3-3V5a3 3 0 013-3z M12 18v3 M9 21h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    title: 'Synced with your calendar',
    body: 'Connect Google Calendar, or subscribe from Apple Calendar and Outlook. Confirmed bookings show up automatically, no double-booking.',
    icon: (
      <path d="M8 2v4 M16 2v4 M3 9h18 M4 4h16a1 1 0 011 1v15a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    title: 'Get paid on the spot',
    body: 'Take full payment or a deposit with Stripe at the time of booking, or leave payment out of it entirely. Your choice, per service.',
    icon: (
      <path d="M12 2v20 M17 5.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5 2.2 3.5 5 3.5 5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    title: 'Run it from your pocket',
    body: 'The Orla iOS app puts your bookings, availability, and customer messages in your pocket, with push notifications the moment something needs you.',
    icon: (
      <path d="M7 2h10a1 1 0 011 1v18a1 1 0 01-1 1H7a1 1 0 01-1-1V3a1 1 0 011-1z M11 18h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
]

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-28">
      <Reveal className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Everything a booking runs on, in one place
        </h2>
        <p className="mt-4 text-secondary">
          No spreadsheets, no missed messages, no double-booked Saturdays.
        </p>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.06}>
            <div className="h-full rounded-2xl border border-border bg-card p-7 transition-colors hover:border-accent/40">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24">{f.icon}</svg>
              </div>
              <h3 className="text-base font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">{f.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
