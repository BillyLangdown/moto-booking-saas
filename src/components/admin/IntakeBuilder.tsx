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

const fieldCls = 'w-full border border-border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink/20 transition'

export default function IntakeBuilder({ questions, onChange }: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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

  return (
    <div className="flex flex-col gap-3">
      {questions.length === 0 && (
        <p className="text-sm text-secondary text-center py-6 bg-white border border-dashed border-border rounded-[10px]">
          No questions yet. Add one below.
        </p>
      )}

      {questions.map((q, i) => (
        <div key={q.id} className="bg-white border border-border rounded-[10px] overflow-hidden">

          {/* Card header */}
          <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white text-[10px] font-bold shrink-0">
                {i + 1}
              </span>
              <span className="text-xs font-medium text-secondary">{TYPE_LABELS[q.type]}</span>
            </div>

            {confirmDeleteId === q.id ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-secondary">Remove?</span>
                <button
                  type="button"
                  onClick={() => { remove(q.id); setConfirmDeleteId(null) }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors px-1"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-xs text-secondary hover:text-ink transition-colors px-1"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteId(q.id)}
                className="text-muted hover:text-rose-500 transition-colors p-1 -mr-1"
                aria-label="Remove question"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M4.5 5V10M7 5V10M9.5 5V10M1.5 3h11M5.5 3V2a1 1 0 011-1h1a1 1 0 011 1v1M12.5 3l-.75 8.5a1 1 0 01-1 .9H3.25a1 1 0 01-1-.9L1.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Question label */}
          <div className="px-4 pb-3">
            <input
              value={q.label}
              onChange={(e) => update(q.id, { label: e.target.value })}
              placeholder="Question text, e.g. What is your experience level?"
              className={fieldCls}
            />
          </div>

          {/* Answer type picker */}
          <div className="px-4 pb-3 grid grid-cols-2 gap-1.5">
            {(Object.keys(TYPE_LABELS) as IntakeQuestion['type'][]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => update(q.id, {
                  type: t,
                  options: t === 'dropdown' ? (q.options?.length ? q.options : ['']) : undefined,
                })}
                className={`py-2 px-3 text-xs font-medium border transition-all text-left rounded-md ${
                  q.type === t
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-secondary border-border hover:border-ink/40 hover:text-ink'
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Dropdown options */}
          {q.type === 'dropdown' && (
            <div className="mx-4 mb-3 border border-border rounded-md p-3 flex flex-col gap-2 bg-subtle/40">
              <p className="text-xs font-medium text-secondary">Options</p>
              {(q.options ?? []).map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={(e) => updateOption(q.id, oi, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                    className={`${fieldCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(q.id, oi)}
                    className="shrink-0 text-muted hover:text-rose-500 transition-colors p-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(q.id)}
                className="text-xs text-secondary hover:text-ink transition-colors text-left"
              >
                + Add option
              </button>
            </div>
          )}

          {/* Required toggle */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border/60 bg-subtle/30">
            <span className="text-xs text-secondary">Required</span>
            <button
              type="button"
              role="switch"
              aria-checked={q.required}
              onClick={() => update(q.id, { required: !q.required })}
              className={`relative shrink-0 h-5 w-9 rounded-full transition-colors focus:outline-none ${q.required ? 'bg-ink' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white shadow-sm rounded-full transition-transform ${q.required ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center justify-center gap-2 border-2 border-dashed border-border px-4 py-3.5 text-sm font-medium text-secondary hover:border-ink/30 hover:text-ink transition-colors w-full rounded-[10px]"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Add question
      </button>
    </div>
  )
}
