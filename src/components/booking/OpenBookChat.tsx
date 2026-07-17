'use client'

import { useState, useEffect, useRef } from 'react'
import type { Tenant } from '@/types'
import { createOpenEnquiryAction } from '@/app/actions'

interface DisplayMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ApiMessage {
  role: 'user' | 'assistant'
  content: string
}

interface OrlaResponse {
  complete: boolean
  reply: string
  options?: string[]
  name?: string
  email?: string
  phone?: string
  sessionType?: string
  proposedDate?: string
  proposedTime?: string
  chatSummary?: string
}

type SubmitState = 'idle' | 'submitting' | 'done' | 'error'

interface Props {
  tenant: Tenant
}

export default function OpenBookChat({ tenant }: Props) {
  const accent = tenant.branding?.accentColor ?? '#2563eb'

  const staticGreeting: DisplayMessage = {
    role: 'assistant',
    content: `Hi! I'm here to send your booking request to ${tenant.name} — they'll confirm by email, usually within one working day. What do you need?`,
  }

  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([staticGreeting])
  const [apiMessages, setApiMessages]         = useState<ApiMessage[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [options, setOptions]   = useState<string[]>([])
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const submitted  = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages, loading, submitState])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function autoSubmit(data: OrlaResponse, currentApiMessages: ApiMessage[]) {
    if (submitted.current) return
    submitted.current = true
    setSubmitState('submitting')

    const chatSummaryText = currentApiMessages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n---\n')

    const result = await createOpenEnquiryAction({
      tenantId:     tenant.id,
      name:         data.name ?? 'Unknown',
      email:        data.email ?? '',
      phone:        data.phone,
      sessionType:  data.sessionType ?? tenant.sessionTypes?.[0] ?? 'General enquiry',
      intakeAnswers: {},
      proposedDate: data.proposedDate,
      proposedTime: data.proposedTime,
      chatSummary:  data.chatSummary ?? chatSummaryText,
    })

    if (result.error) {
      submitted.current = false
      setSubmitState('error')
      setSubmitError(result.error)
    } else {
      setSubmitState('done')
    }
  }

  async function sendMessage(userContent: string) {
    const userMsg: ApiMessage = { role: 'user', content: userContent }
    const nextApiMessages = [...apiMessages, userMsg]

    setDisplayMessages(prev => [...prev, { role: 'user', content: userContent }])
    setApiMessages(nextApiMessages)
    setInput('')
    setOptions([])
    setLoading(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/orla-openbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug: tenant.slug, messages: nextApiMessages }),
      })

      const data = (await res.json()) as OrlaResponse
      const reply = data.reply ?? ''
      const withReply = [...nextApiMessages, { role: 'assistant' as const, content: reply }]

      setDisplayMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setApiMessages(withReply)

      if (data.complete) {
        // Small delay so the user can read Orla's final message before the success screen
        setTimeout(() => autoSubmit(data, withReply), 1200)
      } else {
        setOptions(data.options?.length ? data.options : [])
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      if (submitState === 'idle') setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitState === 'done') {
    return (
      <div className="min-h-dvh flex flex-col bg-slate-50">
        <ChatHeader tenant={tenant} accent={accent} />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-8">
          <div className="relative flex items-center justify-center">
            {/* Pulse ring */}
            <div
              className="absolute h-24 w-24 rounded-full animate-ping opacity-20"
              style={{ background: accent }}
            />
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center"
              style={{ background: accent }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-slate-900">Enquiry sent</h2>
            <p className="text-slate-500 mt-2 max-w-xs leading-relaxed">
              {tenant.name} has received your enquiry and will be in touch shortly to confirm.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const isComplete = submitState === 'submitting' || submitState === 'error'

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <ChatHeader tenant={tenant} accent={accent} />

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-3 max-w-xl mx-auto w-full">
        {displayMessages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div
                className="h-7 w-7 rounded-full shrink-0 mr-2 mt-0.5 flex items-center justify-center text-white text-xs font-bold"
                style={{ background: accent }}
              >
                O
              </div>
            )}
            <div
              className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl ${
                m.role === 'user'
                  ? 'text-white rounded-tr-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
              }`}
              style={m.role === 'user' ? { background: accent } : undefined}
            >
              {m.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div
              className="h-7 w-7 rounded-full shrink-0 mr-2 flex items-center justify-center text-white text-xs font-bold"
              style={{ background: accent }}
            >
              O
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Auto-submitting indicator */}
        {submitState === 'submitting' && (
          <div className="flex justify-center py-2">
            <span className="text-xs text-slate-400 flex items-center gap-2">
              <svg className="animate-spin h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Submitting your enquiry…
            </span>
          </div>
        )}

        {/* Submission error with retry */}
        {submitState === 'error' && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
            <p className="text-sm text-rose-700 mb-3">{submitError ?? 'Something went wrong submitting your enquiry.'}</p>
            <button
              onClick={() => {
                submitted.current = false
                setSubmitState('idle')
              }}
              className="text-sm font-medium text-rose-700 underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!isComplete && (
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 safe-area-bottom">
          {options.length > 0 && !loading && (
            <div className="flex flex-wrap gap-2 max-w-xl mx-auto mb-2.5">
              {options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessage(opt)}
                  className="px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors hover:opacity-80"
                  style={{ borderColor: accent, color: accent }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 max-w-xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && input.trim() && !loading) {
                  e.preventDefault()
                  sendMessage(input.trim())
                }
              }}
              placeholder="Describe what you need help with…"
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition disabled:opacity-50"
              style={{ '--tw-ring-color': accent + '40' } as React.CSSProperties}
            />
            <button
              onClick={() => input.trim() && !loading && sendMessage(input.trim())}
              disabled={!input.trim() || loading}
              className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-white transition-opacity disabled:opacity-40"
              style={{ background: accent }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ChatHeader({ tenant, accent }: { tenant: Tenant; accent: string }) {
  return (
    <div className="px-4 py-4 border-b border-slate-200 bg-white">
      <div className="max-w-xl mx-auto flex items-center gap-3">
        {tenant.logoUrl ? (
          <img src={tenant.logoUrl} alt={tenant.name} className="h-8 w-auto object-contain" />
        ) : (
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: accent }}
          >
            {tenant.name.charAt(0)}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-slate-900">{tenant.name}</p>
          <p className="text-xs text-slate-400">Powered by Orla</p>
        </div>
      </div>
    </div>
  )
}
