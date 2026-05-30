'use client'

import { useState, useRef } from 'react'

interface Props {
  currentUrl?: string
  onUpload: (url: string) => void
}

export default function LogoUpload({ currentUrl, onUpload }: Props) {
  const [preview, setPreview] = useState<string | undefined>(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    if (file.size > 2 * 1024 * 1024) {
      setError('File must be under 2 MB')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-logo', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      setPreview(json.url)
      onUpload(json.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-subtle p-6 transition-colors hover:border-secondary cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Logo" className="h-16 w-auto max-w-[160px] object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-muted">
              <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 22l7-7 5 5 3-3 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-medium text-ink">Upload logo</span>
          </div>
        )}
        <p className="text-xs text-secondary text-center">
          {preview ? 'Tap to replace' : 'PNG, JPG, WebP or SVG · max 2 MB'}
        </p>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80">
            <span className="text-sm text-secondary">Uploading…</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}
