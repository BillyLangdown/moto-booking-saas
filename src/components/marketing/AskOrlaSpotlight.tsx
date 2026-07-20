import Reveal from './Reveal'

const CHAT = [
  { from: 'user', text: 'Hi, do you do boiler servicing? Mine started making a weird noise' },
  { from: 'orla', text: "Yes, that's something we cover. Roughly how long has the noise been happening, and is it constant or only when it's running?" },
  { from: 'user', text: 'Only when it kicks on, been about a week' },
  { from: 'orla', text: "Got it, I've got a slot Thursday afternoon that works around your schedule. What's the best name, email and phone to book it under?" },
]

export default function AskOrlaSpotlight() {
  return (
    <section id="ask-orla" className="mx-auto max-w-6xl px-6 py-28">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Ask Orla</span>
          <h2 className="font-display mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            The work that doesn&apos;t fit
            <br />a fixed time slot
          </h2>
          <p className="mt-5 max-w-md text-secondary">
            Some jobs don&apos;t fit a calendar grid. Open Enquiry mode lets
            customers describe what they need. Orla asks the right follow-up
            questions, checks your schedule, and hands you a clear request to
            confirm or decline.
          </p>
          <p className="mt-4 max-w-md text-sm text-muted">
            You stay in control. Every enquiry is reviewed by you before
            anything is confirmed.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="rounded-2xl border border-border bg-card p-7 shadow-2xl sm:p-8">
            <div className="flex flex-col gap-6">
              {CHAT.map((m, i) => (
                <div key={i} className={`flex flex-col gap-1.5 ${m.from === 'user' ? 'items-end' : 'items-start'}`}>
                  {m.from === 'orla' && (
                    <div className="flex items-center gap-2 pl-1">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                        O
                      </div>
                      <span className="text-xs font-medium text-muted">Orla · AI</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.from === 'user'
                        ? 'rounded-tr-sm bg-accent text-white'
                        : 'rounded-tl-sm border border-border bg-surface text-ink'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
