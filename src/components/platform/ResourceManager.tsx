'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Resource, ResourceType } from '@/types'
import { createResourceAction, deleteResourceAction } from '@/app/platform/actions'

interface Props {
  tenantId: string
  resources: Resource[]
}

const inputClass = 'border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink/20 transition'

export default function ResourceManager({ tenantId, resources }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [type, setType] = useState<ResourceType>('staff')
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    if (!name.trim()) return
    setError(null)
    const result = await createResourceAction(tenantId, name.trim(), type)
    if (result.error) {
      setError(result.error)
    } else {
      setName('')
      router.refresh()
    }
  }

  function handleDelete(resourceId: string) {
    startTransition(async () => {
      await deleteResourceAction(resourceId, tenantId)
      router.refresh()
    })
  }

  const typeLabel: Record<ResourceType, string> = { staff: 'Staff', location: 'Location', resource: 'Resource' }

  return (
    <div className="flex flex-col gap-4">

      {resources.length === 0 ? (
        <p className="text-sm text-secondary py-4 text-center">No resources added yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {resources.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">{r.name}</p>
                <p className="text-xs text-secondary">{typeLabel[r.type]}</p>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                disabled={pending}
                className="text-secondary hover:text-rose-500 transition-colors disabled:opacity-50"
                aria-label={`Remove ${r.name}`}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                  <path d="M5 5.5V11M7.5 5.5V11M10 5.5V11M2 3.5h11M6 3.5V2.5a1 1 0 011-1h1a1 1 0 011 1v1M13 3.5l-.8 9a1 1 0 01-1 .9H3.8a1 1 0 01-1-.9L2 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 pt-2 border-t border-border">
        <p className="text-xs font-medium uppercase tracking-wide text-secondary">Add resource</p>
        <div className="flex gap-2 flex-wrap">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            placeholder="Name"
            className={`${inputClass} flex-1 min-w-32`}
          />
          <select value={type} onChange={(e) => setType(e.target.value as ResourceType)} className={inputClass}>
            <option value="staff">Staff</option>
            <option value="location">Location</option>
            <option value="resource">Resource</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="bg-ink text-white px-3 py-2 text-sm font-medium hover:bg-ink/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>

    </div>
  )
}
