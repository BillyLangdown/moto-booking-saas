import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

const base =
  'w-full border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink/20 transition'

export function Input({ label, error, id, ...props }: InputProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-ink">
        {label}
        {props.required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      <input id={fieldId} className={`${base} ${error ? 'border-rose-400' : ''}`} {...props} />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, id, ...props }: TextareaProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <textarea id={fieldId} rows={3} className={`${base} resize-none ${error ? 'border-rose-400' : ''}`} {...props} />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}
