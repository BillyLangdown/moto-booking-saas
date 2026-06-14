'use client'

import { useState, KeyboardEvent } from 'react'

interface Props {
  types: string[]
  onChange: (types: string[]) => void
  suggestions?: string[]
}

export default function SessionTypeEditor({ types, onChange, suggestions = [] }: Props) {
  const [input, setInput] = useState('')
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  function add(val: string) {
    const trimmed = val.trim()
    if (!trimmed || types.includes(trimmed)) return
    onChange([...types, trimmed])
    setInput('')
  }

  function remove(t: string) {
    onChange(types.filter((x) => x !== t))
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); add(input) }
  }

  return (
    <div className="flex flex-col gap-4">

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="e.g. Track Day, Coaching Session"
          className="flex-1 border border-border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition"
        />
        <button
          type="button"
          onClick={() => add(input)}
          disabled={!input.trim() || types.includes(input.trim())}
          className="px-4 py-2.5 bg-ink text-white text-sm font-medium hover:bg-ink/85 transition-colors disabled:opacity-40 shrink-0"
        >
          Add
        </button>
      </div>

      {types.length > 0 ? (
        <div className="flex flex-col divide-y divide-border/50">
          {types.map((t) => (
            <div key={t} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-ink">{t}</span>
              {confirmRemove === t ? (
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className="text-xs text-secondary">Remove?</span>
                  <button
                    type="button"
                    onClick={() => { remove(t); setConfirmRemove(null) }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors px-1"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(null)}
                    className="text-xs text-secondary hover:text-ink transition-colors px-1"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRemove(t)}
                  className="text-xs text-secondary hover:text-rose-500 transition-colors ml-4 shrink-0"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted italic">None added yet</p>
      )}

    </div>
  )
}
