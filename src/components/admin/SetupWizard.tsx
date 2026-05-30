'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { IntakeQuestion, Tenant } from '@/types'
import { updateTenantAction, saveIntakeQuestionsAction, completeOnboardingAction } from '@/app/actions'
import { getTheme, THEMES } from '@/lib/themes'
import ThemePicker from './ThemePicker'
import LogoUpload from './LogoUpload'
import IntakeBuilder from './IntakeBuilder'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Props { tenant: Tenant }

const STEPS = ['Welcome', 'Branding', 'Booking questions', 'Done']

const EXAMPLE_QUESTIONS: IntakeQuestion[] = [
  { id: 'ex1', type: 'dropdown', label: 'Riding experience', required: true, options: ['None', 'Moped / Scooter', '125cc', 'Larger bike'] },
  { id: 'ex2', type: 'number', label: 'Age', required: true },
  { id: 'ex3', type: 'number', label: 'Height (cm)', required: false },
  { id: 'ex4', type: 'yesno', label: 'Do you hold a valid driving licence?', required: true },
]

export default function SetupWizard({ tenant }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [name, setName]           = useState(tenant.name)
  const [description, setDesc]    = useState(tenant.description)
  const [logoUrl, setLogoUrl]     = useState(tenant.logoUrl ?? '')
  const [themeId, setThemeId]     = useState(tenant.theme ?? THEMES[0].id)
  const [questions, setQuestions] = useState<IntakeQuestion[]>([])
  const [useExamples, setUseExamples] = useState(false)

  async function handleNext() {
    if (step === 0) {
      setSaving(true)
      await updateTenantAction(tenant.id, {
        name, email: tenant.email, phone: tenant.phone,
        address: tenant.address, description,
        primaryColor: getTheme(themeId).primaryColor,
        accentColor: getTheme(themeId).accentColor,
      })
      setSaving(false)
      setStep(1)
    } else if (step === 1) {
      setSaving(true)
      const theme = getTheme(themeId)
      await updateTenantAction(tenant.id, {
        name, email: tenant.email, phone: tenant.phone,
        address: tenant.address, description,
        logoUrl: logoUrl || undefined,
        theme: themeId,
        primaryColor: theme.primaryColor,
        accentColor: theme.accentColor,
      })
      setSaving(false)
      setStep(2)
    } else if (step === 2) {
      setSaving(true)
      const finalQ = useExamples ? EXAMPLE_QUESTIONS : questions
      await saveIntakeQuestionsAction(tenant.id, finalQ)
      setSaving(false)
      setStep(3)
    } else {
      await completeOnboardingAction(tenant.id)
      router.push('/dashboard/bookings')
    }
  }

  const labelClass = 'text-xs font-semibold uppercase tracking-wide text-secondary'

  return (
    <div className="min-h-screen bg-subtle flex flex-col">
      {/* Progress */}
      <div className="bg-white border-b border-border px-4 py-4">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-white text-xs font-bold">B</div>
            <span className="text-sm font-semibold text-ink">Setup</span>
          </div>
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-ink' : 'bg-border'}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-secondary">Step {step + 1} of {STEPS.length}</span>
            <span className="text-xs font-medium text-ink">{STEPS[step]}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 mx-auto w-full max-w-xl px-4 py-8 flex flex-col gap-6">
        {step === 0 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Welcome! 👋</h1>
              <p className="text-secondary mt-1">Let's get your booking page set up in a few quick steps.</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-5 flex flex-col gap-4">
              <Input label="Business name" value={name} onChange={(e) => setName(e.target.value)} required />
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Description <span className="normal-case font-normal text-muted">(shown on your booking page)</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  placeholder="What customers can expect when they book with you…"
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent transition resize-none"
                />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Brand your page</h1>
              <p className="text-secondary mt-1">Add your logo and pick a colour theme.</p>
            </div>
            <div className="rounded-xl border border-border bg-white divide-y divide-border">
              <div className="p-5 flex flex-col gap-3">
                <label className={labelClass}>Logo <span className="normal-case font-normal text-muted">(optional)</span></label>
                <LogoUpload currentUrl={logoUrl || undefined} onUpload={setLogoUrl} />
              </div>
              <div className="p-5 flex flex-col gap-3">
                <label className={labelClass}>Colour theme</label>
                <ThemePicker value={themeId} onChange={setThemeId} />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-ink">Booking questions</h1>
              <p className="text-secondary mt-1">
                Customers answer these before confirming. Great for collecting info specific to your service.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4 flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setUseExamples(true); setQuestions([]) }}
                  className={`flex-1 rounded-lg border-2 px-3 py-3 text-sm text-left transition-colors ${useExamples ? 'border-ink bg-subtle' : 'border-border hover:border-secondary'}`}
                >
                  <p className="font-semibold text-ink">Use moto school examples</p>
                  <p className="text-xs text-secondary mt-0.5">Experience level, age, height, licence</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setUseExamples(false) }}
                  className={`flex-1 rounded-lg border-2 px-3 py-3 text-sm text-left transition-colors ${!useExamples ? 'border-ink bg-subtle' : 'border-border hover:border-secondary'}`}
                >
                  <p className="font-semibold text-ink">Build my own</p>
                  <p className="text-xs text-secondary mt-0.5">Fully custom for any industry</p>
                </button>
              </div>

              {useExamples ? (
                <ul className="flex flex-col gap-1.5 pt-1">
                  {EXAMPLE_QUESTIONS.map((q) => (
                    <li key={q.id} className="flex items-center gap-2 text-sm text-secondary">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {q.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <IntakeBuilder questions={questions} onChange={setQuestions} />
              )}
            </div>
            <p className="text-xs text-secondary text-center">You can always change these later in Settings.</p>
          </>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center text-center gap-6 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-3xl">🎉</div>
            <div>
              <h1 className="text-2xl font-bold text-ink">You&apos;re all set!</h1>
              <p className="text-secondary mt-2 max-w-sm">
                Your booking page is live. Share the link below with your customers.
              </p>
            </div>
            <div className="w-full rounded-xl border border-border bg-white p-4 text-left flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Your booking link</span>
                <span className="font-mono text-sm text-accent break-all">{typeof window !== 'undefined' ? window.location.origin : ''}/book/{tenant.slug}</span>
              </div>
              <div className="border-t border-border pt-3 flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Next steps</span>
                <p className="text-sm text-secondary">Go to <strong className="text-ink">Availability</strong> to add your first bookable slots.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="bg-white border-t border-border px-4 py-4">
        <div className="mx-auto max-w-xl flex items-center justify-between">
          {step > 0 && step < 3 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="text-sm text-secondary hover:text-ink transition-colors">
              ← Back
            </button>
          ) : <div />}
          <Button onClick={handleNext} loading={saving}>
            {step === 3 ? 'Go to dashboard' : step === 2 ? 'Save & finish' : 'Continue →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
