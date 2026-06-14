import type { BookingStatus } from '@/types'

const STATUS_STYLES: Record<BookingStatus, string> = {
  confirmed:        'bg-accent/10 text-accent border border-accent/20',
  pending:          'text-secondary border border-dashed border-border bg-transparent',
  cancelled:        'bg-subtle text-muted border border-border line-through',
  awaiting_payment: 'bg-subtle text-secondary border border-border',
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed:        'Confirmed',
  pending:          'Pending',
  cancelled:        'Cancelled',
  awaiting_payment: 'Awaiting payment',
}

interface Props {
  variant: 'session' | 'status'
  value: string
}

export default function Badge({ variant, value }: Props) {
  if (variant === 'session') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-subtle text-secondary border border-border">
        {value}
      </span>
    )
  }

  const style = STATUS_STYLES[value as BookingStatus] ?? 'bg-subtle text-secondary border border-border'
  const label = STATUS_LABELS[value as BookingStatus] ?? value

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${style}`}>
      {label}
    </span>
  )
}
