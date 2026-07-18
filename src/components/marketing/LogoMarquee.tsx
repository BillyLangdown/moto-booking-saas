const BUSINESSES = [
  'Salons', 'Trades & callouts', 'Studios', 'Clinics', 'Instructors',
  'Photographers', 'Mobile mechanics', 'Consultants', 'Barbers', 'Therapists',
]

export default function LogoMarquee() {
  const items = [...BUSINESSES, ...BUSINESSES]

  return (
    <section className="border-y border-border py-8">
      <div className="overflow-hidden">
        <div className="animate-marquee flex w-max gap-12 whitespace-nowrap">
          {items.map((b, i) => (
            <span key={i} className="text-lg font-medium text-muted">
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
