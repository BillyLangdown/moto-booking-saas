import Reveal from './Reveal'

const STEPS = [
  {
    step: '01',
    title: 'Set up your booking page',
    body: 'Add your services, logo, and either your available time slots or a short description of what Orla should know about your business.',
  },
  {
    step: '02',
    title: 'Customers book or enquire',
    body: 'They pick a slot, or chat with Ask Orla if it’s custom work — either way, you get the details you actually need up front.',
  },
  {
    step: '03',
    title: 'Confirm from web or iOS',
    body: 'Review new bookings, confirm or decline, and message customers directly for anything you need to double check.',
  },
  {
    step: '04',
    title: 'Get paid, stay in sync',
    body: 'Payment is collected through Stripe if you’ve set it up, and confirmed bookings land straight in your calendar.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-28">
      <Reveal className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
        <p className="mt-4 text-secondary">Up and running in an afternoon, not a sprint.</p>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <Reveal key={s.step} delay={i * 0.08} className="flex gap-5">
            <span className="font-display shrink-0 text-3xl font-extrabold text-accent/40">{s.step}</span>
            <div>
              <h3 className="text-base font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
