'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Resource, Tenant } from '@/types'
import ResourceManager from './ResourceManager'
import { deleteBusinessAction } from '@/app/platform/actions'

interface Props {
  tenant: Tenant
  resources: Resource[]
}

const TABS = ['Details', 'Resources'] as const
type Tab = typeof TABS[number]

export default function BusinessDetailClient({ tenant, resources }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('Details')
  const [showDelete, setShowDelete] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete() {
    if (confirmText !== tenant.name) return
    setDeleting(true)
    setDeleteError(null)
    const result = await deleteBusinessAction(tenant.id)
    if (result.error) {
      setDeleteError(result.error)
      setDeleting(false)
    } else {
      router.push('/platform')
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Back */}
      <Link href="/platform" className="flex items-center gap-1.5 text-sm text-secondary hover:text-ink transition-colors w-fit">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        All businesses
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center bg-ink/10 text-ink text-lg font-bold shrink-0">
          {tenant.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-ink">{tenant.name}</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-sm text-secondary">{tenant.slug}</span>
            <Link
              href={`/book/${tenant.slug}`}
              target="_blank"
              className="text-xs text-accent hover:underline"
            >
              View booking page ↗
            </Link>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex border-b border-border">
        {TABS.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-colors relative',
              tab === t ? 'text-ink' : 'text-secondary hover:text-ink',
            ].join(' ')}
          >
            {t}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />}
          </button>
        ))}
      </div>

      {/* Details */}
      {tab === 'Details' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white shadow-sm divide-y divide-border/50">
            <div className="px-5 py-3 flex justify-between text-sm">
              <span className="text-secondary">Email</span>
              <span className="text-ink">{tenant.email || '—'}</span>
            </div>
            <div className="px-5 py-3 flex justify-between text-sm">
              <span className="text-secondary">Phone</span>
              <span className="text-ink">{tenant.phone || '—'}</span>
            </div>
            <div className="px-5 py-3 flex justify-between text-sm">
              <span className="text-secondary">Address</span>
              <span className="text-ink">{tenant.address || '—'}</span>
            </div>
            <div className="px-5 py-3 flex justify-between text-sm">
              <span className="text-secondary">Booking URL</span>
              <span className="font-mono text-xs text-ink">/book/{tenant.slug}</span>
            </div>
            <div className="px-5 py-3 flex justify-between text-sm">
              <span className="text-secondary">Tenant ID</span>
              <span className="font-mono text-xs text-secondary">{tenant.id}</span>
            </div>
          </div>

          {/* Danger zone */}
          <div className="border border-rose-200 bg-rose-50/50">
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-rose-700">Delete this business</p>
                <p className="text-xs text-rose-600/80 mt-0.5">
                  Permanently removes the business, all bookings, slots, and users. This cannot be undone.
                </p>
              </div>
              {!showDelete && (
                <button
                  type="button"
                  onClick={() => setShowDelete(true)}
                  className="shrink-0 px-3 py-1.5 text-sm font-medium text-rose-700 border border-rose-300 hover:bg-rose-100 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>

            {showDelete && (
              <div className="border-t border-rose-200 px-5 py-4 flex flex-col gap-3">
                <p className="text-sm text-rose-700">
                  Type <strong>{tenant.name}</strong> to confirm.
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={tenant.name}
                  className="w-full border border-rose-300 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
                  autoFocus
                />
                {deleteError && (
                  <p className="text-xs text-rose-700">{deleteError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={confirmText !== tenant.name || deleting}
                    className="px-4 py-2 bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-40"
                  >
                    {deleting ? 'Deleting…' : 'Delete permanently'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowDelete(false); setConfirmText(''); setDeleteError(null) }}
                    className="px-4 py-2 text-sm text-secondary hover:text-ink transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resources */}
      {tab === 'Resources' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-secondary">
            Staff and assets available to assign to sessions.
          </p>
          <div className="bg-white shadow-sm p-5">
            <ResourceManager tenantId={tenant.id} resources={resources} />
          </div>
        </div>
      )}

    </div>
  )
}
