'use client'

import { useState, KeyboardEvent } from 'react'

interface Props {
  types: string[]
  onChange: (types: string[]) => void
  suggestions?: string[]
}

export default function SessionTypeEditor({ types, onChange, suggestions = [] }: Props) {
  const [input, setInput] = useState('')

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

      {types.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <span key={t} className="inline-flex items-center gap-2 bg-ink text-white text-sm px-3 py-1.5">
              {t}
              <button
                type="button"
                onClick={() => remove(t)}
                className="opacity-50 hover:opacity-100 transition-opacity"
                aria-label={`Remove ${t}`}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-secondary">No services added yet.</p>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Add a service…"
          className="flex-1 border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent transition"
        />
        <button
          type="button"
          onClick={() => add(input)}
          disabled={!input.trim() || types.includes(input.trim())}
          className="px-4 py-2 bg-ink text-white text-sm font-medium hover:bg-ink/80 transition-colors disabled:opacity-40"
        >
          Add
        </button>
      </div>

    </div>
  )
}
