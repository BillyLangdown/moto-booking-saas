'use client'

import { THEMES } from '@/lib/themes'

interface Props {
  value: string
  onChange: (themeId: string) => void
}

export default function ThemePicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {THEMES.map((theme) => {
        const active = value === theme.id
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
              active
                ? 'border-ink shadow-sm'
                : 'border-border hover:border-secondary'
            }`}
          >
            <div className="flex gap-1">
              <div className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
              <div className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.accentColor }} />
            </div>
            <span className="text-xs text-secondary">{theme.name}</span>
          </button>
        )
      })}
    </div>
  )
}
