import type { LicenceType, BookingStatus } from '@/types'

const LICENCE_COLOURS: Record<LicenceType, string> = {
  CBT:       'bg-blue-50 text-blue-700 ring-blue-200',
  A1:        'bg-violet-50 text-violet-700 ring-violet-200',
  A2:        'bg-purple-50 text-purple-700 ring-purple-200',
  DAS:       'bg-rose-50 text-rose-700 ring-rose-200',
  Refresher: 'bg-teal-50 text-teal-700 ring-teal-200',
}

const STATUS_COLOURS: Record<BookingStatus, string> = {
  confirmed:  'bg-green-50 text-green-700 ring-green-200',
  pending:    'bg-amber-50 text-amber-700 ring-amber-200',
  cancelled:  'bg-slate-50 text-slate-500 ring-slate-200',
}

interface Props {
  variant: 'licence' | 'status'
  value: LicenceType | BookingStatus
}

export default function Badge({ variant, value }: Props) {
  const colour =
    variant === 'licence'
      ? LICENCE_COLOURS[value as LicenceType]
      : STATUS_COLOURS[value as BookingStatus]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${colour}`}
    >
      {value}
    </span>
  )
}
