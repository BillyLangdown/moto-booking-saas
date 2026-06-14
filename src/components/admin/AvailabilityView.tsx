'use client'

import { useState } from 'react'
import type { AvailabilitySlot, Resource } from '@/types'
import AvailabilityList from './AvailabilityList'
import SlotCreateForm from './SlotCreateForm'

interface Props {
  slots: AvailabilitySlot[]
  tenantId: string
  resources: Resource[]
  sessionTypes?: string[]
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
        active
          ? 'bg-ink text-white'
          : 'bg-card border border-border text-secondary hover:text-ink hover:border-secondary/40',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export default function AvailabilityView({ slots, tenantId, resources, sessionTypes }: Props) {
  const [filterService,  setFilterService]  = useState('')
  const [filterResource, setFilterResource] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const upcomingSlots = slots.filter(s => s.date >= today)

  const serviceOptions  = [...new Set(upcomingSlots.map(s => s.sessionType).filter(Boolean))].sort() as string[]
  const resourceOptions = resources.map(r => r.name)

  const allResources = (slot: typeof upcomingSlots[0]) =>
    [slot.staff, slot.location, slot.equipment, slot.resource].filter(Boolean)

  const filtered = upcomingSlots.filter(s =>
    (!filterService  || s.sessionType === filterService) &&
    (!filterResource || allResources(s).some(r => r!.name === filterResource))
  )

  const slotCount = filtered.length

  return (
    <div className="flex flex-col gap-6 max-w-xl">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Availability</h1>
          <p className="text-sm text-secondary mt-0.5">
            {upcomingSlots.length === 0
              ? 'No slots scheduled yet.'
              : `${slotCount} slot${slotCount !== 1 ? 's' : ''}${filterService || filterResource ? ' matching' : ' scheduled'}`}
          </p>
        </div>
        <div className="shrink-0 pt-0.5">
          <SlotCreateForm tenantId={tenantId} resources={resources} sessionTypes={sessionTypes} />
        </div>
      </div>

      {/* Filters — only shown when there's something to filter */}
      {(serviceOptions.length > 1 || resourceOptions.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {serviceOptions.length > 1 && serviceOptions.map(s => (
            <FilterChip
              key={s}
              label={s}
              active={filterService === s}
              onClick={() => setFilterService(v => v === s ? '' : s)}
            />
          ))}
          {resourceOptions.map(r => (
            <FilterChip
              key={r}
              label={r}
              active={filterResource === r}
              onClick={() => setFilterResource(v => v === r ? '' : r)}
            />
          ))}
          {(filterService || filterResource) && (
            <button
              type="button"
              onClick={() => { setFilterService(''); setFilterResource('') }}
              className="px-3 py-1.5 text-xs font-medium text-muted hover:text-secondary transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <AvailabilityList slots={filtered} />
    </div>
  )
}
