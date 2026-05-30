'use client'

import { useState } from 'react'
import type { IntakeQuestion } from '@/types'

interface Props {
  questions: IntakeQuestion[]
  onChange: (questions: IntakeQuestion[]) => void
}

const TYPE_LABELS: Record<IntakeQuestion['type'], string> = {
  text:     'Short text',
  number:   'Number',
  dropdown: 'Multiple choice',
  yesno:    'Yes / No',
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export default function IntakeBuilder({ questions, onChange }: Props) {
  function add() {
    onChange([...questions, { id: uid(), type: 'text', label: '', required: false }])
  }

  function update(id: string, patch: Partial<IntakeQuestion>) {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  }

  function remove(id: string) {
    onChange(questions.filter((q) => q.id !== id))
  }

  function updateOption(qId: string, idx: number, value: string) {
    const q = questions.find((q) => q.id === qId)
    if (!q) return
    const opts = [...(q.options ?? [])]
    opts[idx] = value
    update(qId, { options: opts })
  }

  function addOption(qId: string) {
    const q = questions.find((q) => q.id === qId)
    if (!q) return
    update(qId, { options: [...(q.options ?? []), ''] })
  }

  function removeOption(qId: string, idx: number) {
    const q = questions.find((q) => q.id === qId)
    if (!q) return
    const opts = [...(q.options ?? [])]
    opts.splice(idx, 1)
    update(qId, { options: opts })
  }

  const inputClass = 'rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent transition'

  return (
    <div className="flex flex-col gap-3">
      {questions.length === 0 && (
        <p className="text-sm text-secondary text-center py-4">
          No questions yet. Add one below.
        </p>
      )}

      {questions.map((q, i) => (
        <div key={q.id} className="rounded-xl border border-border bg-white p-4 flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-secondary shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 flex flex-col gap-2">
              <input
                value={q.label}
                onChange={(e) => update(q.id, { label: e.target.value })}
                placeholder="Question text, e.g. What is your riding experience?"
                className={`${inputClass} w-full`}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={q.type}
                  onChange={(e) => update(q.id, { type: e.target.value as IntakeQuestion['type'], options: e.target.value === 'dropdown' ? [''] : undefined })}
                  className={`${inputClass} text-xs`}
                >
                  {(Object.keys(TYPE_LABELS) as IntakeQuestion['type'][]).map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => update(q.id, { required: e.target.checked })}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                  Required
                </label>
              </div>

              {q.type === 'dropdown' && (
                <div className="flex flex-col gap-1.5 pl-1">
                  {(q.options ?? []).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        value={opt}
                        onChange={(e) => updateOption(q.id, oi, e.target.value)}
                        placeholder={`Option ${oi + 1}`}
                        className={`${inputClass} flex-1 text-xs`}
                      />
                      <button type="button" onClick={() => removeOption(q.id, oi)} className="text-secondary hover:text-rose-500 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addOption(q.id)} className="text-xs text-accent hover:underline w-fit">
                    + Add option
                  </button>
                </div>
              )}
            </div>
            <button type="button" onClick={() => remove(q.id)} className="text-secondary hover:text-rose-500 transition-colors shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 15 15" fill="none"><path d="M5 5.5V11M7.5 5.5V11M10 5.5V11M2 3.5h11M6 3.5V2.5a1 1 0 011-1h1a1 1 0 011 1v1M13 3.5l-.8 9a1 1 0 01-1 .9H3.8a1 1 0 01-1-.9L2 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-3 text-sm text-secondary hover:border-accent hover:text-accent transition-colors w-full justify-center"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        Add question
      </button>
    </div>
  )
}
