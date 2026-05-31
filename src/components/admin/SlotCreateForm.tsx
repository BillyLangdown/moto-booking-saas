'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Resource, CreateSlotInput } from '@/types'
import { createSlotsAction } from '@/app/actions'

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
]

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function weeksFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n * 7)
  return d.toISOString().split('T')[0]
}

export function generateRecurringDates(from: string, until: string, dayValues: number[]): string[] {
  if (!dayValues.length) return []
  const dates: string[] = []
  const cur = new Date(from + 'T12:00:00')
  const end = new Date(until + 'T12:00:00')
  while (cur <= end) {
    if (dayValues.includes(cur.getDay())) {
      dates.push(cur.toISOString().split('T')[0])
    }
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

function durationLabel(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  if (mins <= 0) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

const field = 'w-full border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink/20 transition'
const lbl   = 'text-xs font-medium text-secondary uppercase tracking-wide'

interface Props {
  tenantId: string
  resources: Resource[]
  sessionTypes?: string[]
  fullWidth?: boolean
}

export default function SlotCreateForm({ tenantId, resources, sessionTypes = [], fullWidth = false }: Props) {
  const router = useRouter()
  const [open, setOpen]     = useState(false)
  const [mode, setMode]     = useState<'once' | 'recurring'>('recurring')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const [resourceId, setResourceId] = useState(resources[0]?.id ?? '')
  const [sessionType, setSessionType] = useState(sessionTypes[0] ?? '')
  const [startTime, setStartTime]   = useState('09:00')
  const [endTime, setEndTime]       = useState('17:00')
  const [capacity, setCapacity]     = useState(1)

  // One-off
  const [date, setDate]           = useState(todayStr())
  const [extraDays, setExtraDays] = useState<number[]>([])

  // Recurring
  const [recurDays, setRecurDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [fromDate, setFromDate]   = useState(todayStr())
  const [untilDate, setUntilDate] = useState(weeksFromNow(8))

  function close() { setOpen(false); setError(null) }

  function toggleDay(arr: number[], v: number, set: (x: number[]) => void) {
    set(arr.includes(v) ? arr.filter((d) => d !== v) : [...arr, v])
  }

  const recurDates = mode === 'recurring' ? generateRecurringDates(fromDate, untilDate, recurDays) : []
  const duration   = durationLabel(startTime, endTime)

  function buildInputs(): CreateSlotInput[] {
    const base = { tenantId, resourceId, sessionType, startTime, endTime, capacity }
    if (mode === 'once') {
      const sel     = new Date(date + 'T12:00:00')
      const selDay  = sel.getDay()
      const monOffset = (selDay + 6) % 7
      const weekMon   = new Date(sel)
      weekMon.setDate(weekMon.getDate() - monOffset)

      const dates = [date]
      for (const dv of extraDays) {
        const d = new Date(weekMon)
        d.setDate(d.getDate() + (dv === 0 ? 6 : dv - 1))
        const ds = d.toISOString().split('T')[0]
        if (ds !== date) dates.push(ds)
      }
      return dates.map((d) => ({ ...base, date: d }))
    }
    return recurDates.map((d) => ({ ...base, date: d }))
  }

  const slotCount = mode === 'once' ? 1 + extraDays.length : recurDates.length

  async function handleSave() {
    if (!resourceId) { setError('No resource selected.'); return }
    if (mode === 'recurring' && recurDays.length === 0) { setError('Select at least one day.'); return }
    const inputs = buildInputs()
    if (!inputs.length) { setError('No slots to create.'); return }
    setError(null)
    setSaving(true)
    const result = await createSlotsAction(inputs)
    setSaving(false)
    if (result.error) { setError(result.error); return }
    close()
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-2 bg-ink text-white px-4 py-2 text-sm font-medium hover:bg-ink/85 transition-colors ${fullWidth ? 'w-full' : ''}`}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
          <rect x="0.65" y="1.65" width="11.7" height="10.7" rx="1.35" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M0.65 5.5h11.7M4 0.5v2.3M9 0.5v2.3M4.5 8.5h4M6.5 7v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        Add availability
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />

          <div className="relative bg-white w-full sm:max-w-lg shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h2 className="text-sm font-semibold text-ink">Schedule availability</h2>
              <button onClick={close} className="text-secondary hover:text-ink transition-colors w-6 h-6 flex items-center justify-center text-xl leading-none">×</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border shrink-0">
              {(['once', 'recurring'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    mode === m ? 'text-ink border-b-2 border-ink -mb-px bg-white' : 'text-secondary hover:text-ink'
                  }`}
                >
                  {m === 'once' ? 'One-off' : 'Recurring'}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-4">

              {/* Resource — only shown if multiple */}
              {resources.length === 0 ? (
                <p className="text-sm text-secondary bg-amber-50 border border-amber-100 px-3 py-2.5">
                  No resources found. Add a resource (staff, equipment, etc.) from Settings first.
                </p>
              ) : resources.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Resource</label>
                  <select value={resourceId} onChange={(e) => setResourceId(e.target.value)} className={field}>
                    {resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              )}

              {/* One-off: date */}
              {mode === 'once' && (
                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Date</label>
                  <input type="date" value={date} min={todayStr()} onChange={(e) => setDate(e.target.value)} className={field} />
                </div>
              )}

              {/* Recurring: day pills + date range */}
              {mode === 'recurring' && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className={lbl}>Repeat on</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleDay(recurDays, d.value, setRecurDays)}
                          className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                            recurDays.includes(d.value)
                              ? 'bg-ink text-white border-ink'
                              : 'bg-white text-secondary border-border hover:border-ink/30'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className={lbl}>From</label>
                      <input type="date" value={fromDate} min={todayStr()} onChange={(e) => setFromDate(e.target.value)} className={field} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={lbl}>Until</label>
                      <input type="date" value={untilDate} min={fromDate} onChange={(e) => setUntilDate(e.target.value)} className={field} />
                    </div>
                  </div>
                </>
              )}

              {/* Time */}
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className={lbl}>Start</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={field} />
                </div>
                {duration && (
                  <div className="pb-2.5 text-xs text-secondary shrink-0 tabular-nums">{duration}</div>
                )}
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className={lbl}>End</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={field} />
                </div>
              </div>

              {/* Service + Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Service</label>
                  {sessionTypes.length > 0 ? (
                    <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} className={field}>
                      <option value="">All services</option>
                      {sessionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={sessionType} onChange={(e) => setSessionType(e.target.value)} placeholder="Optional" className={field} />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Capacity</label>
                  <input type="number" min={1} max={100} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className={field} />
                </div>
              </div>

              {/* One-off: apply to other days this week */}
              {mode === 'once' && (
                <div className="flex flex-col gap-2">
                  <label className={lbl}>Also apply to</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS.map((d) => {
                      const isSelected = new Date(date + 'T12:00:00').getDay() === d.value
                      return (
                        <button
                          key={d.value}
                          type="button"
                          disabled={isSelected}
                          onClick={() => toggleDay(extraDays, d.value, setExtraDays)}
                          className={`px-3 py-1.5 text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-default ${
                            isSelected || extraDays.includes(d.value)
                              ? 'bg-ink text-white border-ink'
                              : 'bg-white text-secondary border-border hover:border-ink/30'
                          }`}
                        >
                          {d.label}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted">Same hours will be created for each selected day this week.</p>
                </div>
              )}

              {/* Preview */}
              {resources.length > 0 && slotCount > 0 && (
                <div className="flex items-center gap-2 bg-subtle border border-border px-3 py-2.5 text-xs text-secondary">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M6 4v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  {mode === 'recurring' && recurDays.length === 0
                    ? 'Select at least one day'
                    : `Creates ${slotCount} slot${slotCount !== 1 ? 's' : ''}${
                        mode === 'recurring' ? ` over ${Math.round((new Date(untilDate).getTime() - new Date(fromDate).getTime()) / (7 * 24 * 60 * 60 * 1000))} weeks` : ''
                      }`
                  }
                </div>
              )}

              {error && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-4 flex items-center gap-4 shrink-0">
              <button
                onClick={handleSave}
                disabled={saving || resources.length === 0}
                className="bg-ink text-white px-4 py-2 text-sm font-medium hover:bg-ink/85 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : `Create ${slotCount > 1 ? `${slotCount} slots` : 'slot'}`}
              </button>
              <button onClick={close} className="text-sm text-secondary hover:text-ink transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
