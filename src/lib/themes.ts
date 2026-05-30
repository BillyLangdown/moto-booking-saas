export interface Theme {
  id: string
  name: string
  primaryColor: string
  accentColor: string
}

export const THEMES: Theme[] = [
  { id: 'slate',   name: 'Slate',   primaryColor: '#1e293b', accentColor: '#6366f1' },
  { id: 'ocean',   name: 'Ocean',   primaryColor: '#0c1a2e', accentColor: '#0ea5e9' },
  { id: 'forest',  name: 'Forest',  primaryColor: '#14532d', accentColor: '#22c55e' },
  { id: 'warm',    name: 'Warm',    primaryColor: '#1c1917', accentColor: '#f97316' },
  { id: 'rose',    name: 'Rose',    primaryColor: '#1e1b4b', accentColor: '#f43f5e' },
  { id: 'amber',   name: 'Amber',   primaryColor: '#1c1917', accentColor: '#f59e0b' },
]

export function getTheme(id?: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}
