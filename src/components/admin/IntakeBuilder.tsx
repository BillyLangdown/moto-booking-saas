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
        <p className="text-sm text-secondary text-center py-4">
          No questions yet. Add one below.
        </p>
      )}

      {questions.map((q, i) => (
        <div key={q.id} className="border border-border bg-white p-4 flex flex-col gap-3">

          {/* Header: number + delete */}
          <div className="flex items-center justify-between gap-2">
            <span className="flex h-6 w-6 items-center justify-center bg-subtle text-xs font-semibold text-secondary shrink-0">
              {i + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(q.id)}
              className="text-secondary hover:text-rose-500 transition-colors p-1"
              aria-label="Remove question"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M5 5.5V11M7.5 5.5V11M10 5.5V11M2 3.5h11M6 3.5V2.5a1 1 0 011-1h1a1 1 0 011 1v1M13 3.5l-.8 9a1 1 0 01-1 .9H3.8a1 1 0 01-1-.9L2 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Question text */}
          <input
            value={q.label}
            onChange={(e) => update(q.id, { label: e.target.value })}
            placeholder="e.g. What is your experience level?"
            className={fieldCls}
          />

          {/* Type + Required — type full-width, required below */}
          <div className="flex flex-col gap-2">
            <select
              value={q.type}
              onChange={(e) => update(q.id, {
                type: e.target.value as IntakeQuestion['type'],
                options: e.target.value === 'dropdown' ? [''] : undefined,
              })}
              className={fieldCls}
            >
              {(Object.keys(TYPE_LABELS) as IntakeQuestion['type'][]).map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={q.required}
                onChange={(e) => update(q.id, { required: e.target.checked })}
                className="h-4 w-4 border-border"
              />
              Required
            </label>
          </div>

          {/* Dropdown options */}
          {q.type === 'dropdown' && (
            <div className="flex flex-col gap-2 pt-1">
              <p className="text-xs font-medium text-secondary uppercase tracking-wide">Options</p>
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
                    className="shrink-0 text-secondary hover:text-rose-500 transition-colors p-1"
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
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center justify-center gap-2 border-2 border-dashed border-border px-4 py-3 text-sm text-secondary hover:border-ink/30 hover:text-ink transition-colors w-full"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Add question
      </button>
    </div>
  )
}
