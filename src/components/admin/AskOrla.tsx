'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { Booking, AvailabilitySlot } from '@/types'
import type { GmailSnippet } from '@/lib/google'
import type { OrlaAction } from '@/app/api/orla-action/route'

type AppState = 'idle' | 'listening' | 'thinking' | 'answered' | 'confirming'

type OrlaCard = {
  type: 'email' | 'booking' | 'info'
  title: string
  meta?: string
  body: string
  // Booking action metadata
  bookingId?: string
  bookingName?: string
  bookingEmail?: string
  // Email action metadata
  emailId?: string
  emailThreadId?: string
  emailMessageId?: string
  emailFrom?: string
  emailSubject?: string
}

type ConfirmingState = {
  intent: OrlaAction
  preview: string
  cards: OrlaCard[]
}

const GAZE = [
  { x: 0,  y: 0  }, { x: 7,  y: 0  }, { x: -7, y: 0  },
  { x: 4,  y: -3 }, { x: -4, y: -3 }, { x: 3,  y: 3  }, { x: 0,  y: -3 },
]

const EYE_R    = 13
const EYE_CIRC = 2 * Math.PI * EYE_R
const ARC_HALF = EYE_CIRC / 2

const QUICK_PRESETS = [
  { label: 'Daily rundown', query: 'Give me my daily rundown — recent emails that need replies, today\'s bookings, and any recent cancellations or changes.' },
  { label: 'Who\'s in today?', query: 'Who are my bookings for today?' },
  { label: 'Emails to reply to?', query: 'Are there any recent emails I should reply to?' },
  { label: 'Recent cancellations', query: 'Have there been any recent cancellations or changes to bookings?' },
]

export default function AskOrla({ bookings, slots }: { bookings: Booking[]; slots: AvailabilitySlot[] }) {
  const [state, setState]               = useState<AppState>('idle')
  const [transcript, setTranscript]     = useState('')
  const [textInput, setTextInput]       = useState('')
  const [summary, setSummary]           = useState('')
  const [cards, setCards]               = useState<OrlaCard[]>([])
  const [suggestions, setSuggestions]   = useState<string[]>([])
  const [confirming, setConfirming]     = useState<ConfirmingState | null>(null)
  const [draftBody, setDraftBody]       = useState('')
  const [lastEmails, setLastEmails]     = useState<GmailSnippet[]>([])
  const [replyCard, setReplyCard]       = useState<OrlaCard | null>(null)
  const [replyText, setReplyText]       = useState('')
  const [noteCard, setNoteCard]         = useState<OrlaCard | null>(null)
  const [noteText, setNoteText]         = useState('')
  const [error, setError]               = useState('')
  const [isBlinking, setIsBlinking]     = useState(false)
  const [gaze, setGaze]                 = useState({ x: 0, y: 0 })

  const recognitionRef  = useRef<unknown>(null)
  const transcriptRef   = useRef('')
  const blinkTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gazeTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isListening  = state === 'listening'
  const isThinking   = state === 'thinking'
  const isConfirming = state === 'confirming'
  const isIdle       = !isListening && !isThinking

  // Blink
  useEffect(() => {
    if (isListening || isThinking) {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current)
      setIsBlinking(false)
      return
    }
    function scheduleBlink() {
      blinkTimerRef.current = setTimeout(() => {
        setIsBlinking(true)
        setTimeout(() => { setIsBlinking(false); scheduleBlink() }, 140)
      }, 3000 + Math.random() * 4000)
    }
    scheduleBlink()
    return () => { if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current) }
  }, [isListening, isThinking])

  // Gaze drift
  useEffect(() => {
    if (isListening || isThinking) { setGaze({ x: 0, y: 0 }); return }
    function scheduleGaze() {
      gazeTimerRef.current = setTimeout(() => {
        setGaze(GAZE[Math.floor(Math.random() * GAZE.length)])
        scheduleGaze()
      }, 2500 + Math.random() * 3500)
    }
    scheduleGaze()
    return () => { if (gazeTimerRef.current) clearTimeout(gazeTimerRef.current) }
  }, [isListening, isThinking])

  function clearResults() {
    setSummary('')
    setCards([])
    setSuggestions([])
    setConfirming(null)
    setReplyCard(null)
    setReplyText('')
    setNoteCard(null)
    setNoteText('')
    setError('')
  }

  async function submitQuery(query: string) {
    if (!query.trim()) return
    setState('thinking')
    clearResults()
    setTranscript('')
    try {
      const res = await fetch('/api/orla-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, bookings, slots, lastEmails }),
      })
      if (!res.ok) throw new Error('failed')

      const data = (await res.json()) as {
        type?: string
        summary?: string
        cards?: OrlaCard[]
        suggestions?: string[]
        intent?: OrlaAction
        preview?: string
        emails?: GmailSnippet[]
      }

      if (data.emails?.length) setLastEmails(data.emails)

      if (data.type === 'action' && data.intent && data.preview) {
        const conf: ConfirmingState = { intent: data.intent, preview: data.preview, cards: data.cards ?? [] }
        setConfirming(conf)
        if (data.intent.action === 'reply_email') setDraftBody(data.intent.body)
        setState('confirming')
      } else {
        setSummary(data.summary ?? '')
        setCards(data.cards ?? [])
        setSuggestions(data.suggestions ?? [])
        setState('answered')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setState('idle')
    }
  }

  async function executeAction() {
    if (!confirming) return
    setState('thinking')
    setError('')
    try {
      let intent = confirming.intent
      if (intent.action === 'reply_email') intent = { ...intent, body: draftBody }

      const res = await fetch('/api/orla-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent }),
      })
      const data = (await res.json()) as { summary?: string; cards?: OrlaCard[] }
      setSummary(data.summary ?? '')
      setCards(data.cards ?? [])
      setSuggestions([])
      setConfirming(null)
      setState('answered')
    } catch {
      setError('Action failed. Please try again.')
      setState('confirming')
    }
  }

  function triggerBookingAction(card: OrlaCard, action: 'cancel_booking' | 'no_show' | 'add_note') {
    if (!card.bookingId || !card.bookingName) return
    if (action === 'add_note') {
      setNoteCard(card)
      return
    }
    const intent: OrlaAction = action === 'cancel_booking'
      ? { action: 'cancel_booking', bookingId: card.bookingId, bookingName: card.bookingName }
      : { action: 'no_show',        bookingId: card.bookingId, bookingName: card.bookingName }
    const preview = action === 'cancel_booking'
      ? `Cancel ${card.bookingName}'s booking?`
      : `Mark ${card.bookingName} as a no-show?`
    setConfirming({ intent, preview, cards: [card] })
    setState('confirming')
  }

  function submitNote() {
    if (!noteCard?.bookingId || !noteText.trim()) return
    const intent: OrlaAction = {
      action: 'add_note',
      bookingId: noteCard.bookingId,
      bookingName: noteCard.bookingName ?? '',
      note: noteText.trim(),
    }
    setConfirming({ intent, preview: `Add note to ${noteCard.bookingName}'s booking?`, cards: [noteCard] })
    setNoteCard(null)
    setNoteText('')
    setState('confirming')
  }

  function submitReplyDraft() {
    if (!replyCard || !replyText.trim()) return
    const q = `Draft a reply to ${replyCard.emailFrom ?? 'this person'} about "${replyCard.emailSubject ?? replyCard.title}": ${replyText}`
    setReplyCard(null)
    setReplyText('')
    submitQuery(q)
  }

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError('Voice input is not supported in this browser. Use the text input below.'); return }
    transcriptRef.current = ''
    setTranscript('')
    clearResults()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SR() as any
    recognition.continuous     = true
    recognition.interimResults = true
    recognition.lang           = 'en-US'
    recognition.onstart  = () => setState('listening')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('')
      transcriptRef.current = t
      setTranscript(t)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      silenceTimerRef.current = setTimeout(() => { (recognitionRef.current as any)?.stop() }, 2000)
    }
    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      const q = transcriptRef.current
      if (q) submitQuery(q)
      else setState('idle')
    }
    recognition.onerror = () => { setState('idle'); setError('Could not capture audio. Try the text input below.') }
    recognitionRef.current = recognition
    recognition.start()
  }

  function handleVoiceClick() {
    if (isListening) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(recognitionRef.current as any)?.stop()
    } else if (isIdle) {
      startListening()
    }
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = textInput.trim()
    if (!q) return
    submitQuery(q)
    setTextInput('')
  }

  function reset() { setState('idle'); clearResults(); setTranscript('') }

  const eyeStroke     = isListening ? '#0d9488' : '#a8a29e'
  const eyeDashArray  = `${ARC_HALF} ${ARC_HALF}`
  const eyeDashOffset = `${ARC_HALF}`
  const eyeScaleY     = isBlinking ? 0 : 1

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <style>{`
        @keyframes orla-breathe {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.03); }
        }
        @keyframes orla-listen-pulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(45,212,191,0.25); }
          50%       { box-shadow: 0 4px 44px rgba(45,212,191,0.5); }
        }
        @keyframes orla-think-dot {
          0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
          40%           { opacity: 1;   transform: translateY(-4px); }
        }
        @keyframes orla-card-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orla-chip-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .orla-breathe      { animation: orla-breathe 5s ease-in-out infinite; }
        .orla-listen-pulse { animation: orla-listen-pulse 3s ease-in-out infinite; }
        .orla-think-dot-1  { animation: orla-think-dot 1.8s ease-in-out infinite 0s; }
        .orla-think-dot-2  { animation: orla-think-dot 1.8s ease-in-out infinite 0.25s; }
        .orla-think-dot-3  { animation: orla-think-dot 1.8s ease-in-out infinite 0.5s; }
      `}</style>

      {/* Orb */}
      <div className="flex items-center justify-center" style={{ width: 160, height: 160 }}>
        <button
          onClick={handleVoiceClick}
          disabled={isThinking}
          className={[
            'relative flex items-center justify-center transition-all duration-700 focus:outline-none',
            isListening ? 'orla-listen-pulse' : isIdle ? 'orla-breathe' : '',
            isThinking ? 'cursor-not-allowed' : 'cursor-pointer',
          ].join(' ')}
          style={{
            width: 160, height: 160, borderRadius: '50%', overflow: 'hidden',
            background: isListening
              ? 'linear-gradient(135deg, #f0fdfa 0%, #99f6e4 100%)'
              : 'linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%)',
            boxShadow: isIdle ? '0 4px 24px rgba(0,0,0,0.07)' : undefined,
          }}
          aria-label={isListening ? 'Stop listening' : 'Press to speak'}
        >
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
            <g style={{ transform: `translate(${gaze.x}px,${gaze.y}px)`, transition: 'transform 0.9s ease' }}>
              <circle cx="30" cy="40" r={EYE_R} stroke={eyeStroke} strokeWidth="3.5" strokeLinecap="round" fill="none"
                strokeDasharray={eyeDashArray} strokeDashoffset={eyeDashOffset}
                style={{ transformOrigin: '30px 40px', transform: `scaleY(${eyeScaleY})`,
                  transition: isBlinking ? 'transform 0.09s ease, stroke 0.5s ease' : 'transform 0.07s ease, stroke 0.5s ease' }} />
            </g>
            <g style={{ transform: `translate(${gaze.x}px,${gaze.y}px)`, transition: 'transform 0.9s ease' }}>
              <circle cx="70" cy="40" r={EYE_R} stroke={eyeStroke} strokeWidth="3.5" strokeLinecap="round" fill="none"
                strokeDasharray={eyeDashArray} strokeDashoffset={eyeDashOffset}
                style={{ transformOrigin: '70px 40px', transform: `scaleY(${eyeScaleY})`,
                  transition: isBlinking ? 'transform 0.09s ease, stroke 0.5s ease' : 'transform 0.07s ease, stroke 0.5s ease' }} />
            </g>
            {isThinking && (
              <>
                <circle cx="35" cy="68" r="3.5" fill="#a8a29e" className="orla-think-dot-1" />
                <circle cx="50" cy="68" r="3.5" fill="#a8a29e" className="orla-think-dot-2" />
                <circle cx="65" cy="68" r="3.5" fill="#a8a29e" className="orla-think-dot-3" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Status + live transcript */}
      <div className="-mt-2 flex flex-col items-center gap-3 w-full">
        <p className="text-sm min-h-[20px] text-center transition-colors duration-300"
          style={{ color: isListening ? '#0d9488' : '#9ca3af' }}>
          {state === 'idle'       && 'Tap Orla to ask a question'}
          {state === 'listening'  && 'Listening… tap to stop'}
          {state === 'thinking'   && 'On it…'}
          {state === 'answered'   && 'Tap to ask something else'}
          {state === 'confirming' && 'Confirm or cancel below'}
        </p>
        {isListening && transcript && (
          <div className="w-full rounded-2xl px-5 py-3.5 text-center"
            style={{ background: '#f0fdfa', border: '1px solid #99f6e4' }}>
            <p className="text-base text-gray-700 leading-snug">{transcript}</p>
          </div>
        )}
      </div>

      {/* Quick presets — idle only */}
      {state === 'idle' && (
        <div className="w-full grid grid-cols-2 gap-2">
          {QUICK_PRESETS.map((p, i) => (
            <button key={i} onClick={() => submitQuery(p.query)}
              className="w-full px-3 py-2.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:border-teal-300 hover:text-teal-700 transition-colors shadow-sm text-left"
              style={{ animation: `orla-chip-in 0.25s ease both`, animationDelay: `${i * 50}ms` }}>
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Confirmation UI */}
      {isConfirming && confirming && (
        <div className="w-full flex flex-col gap-3" style={{ animation: 'orla-card-in 0.3s ease both' }}>
          <p className="text-sm text-gray-600 px-1 font-medium">{confirming.preview}</p>

          {/* Editable draft for email replies */}
          {confirming.intent.action === 'reply_email' && (
            <div className="w-full rounded-xl border border-teal-200 bg-teal-50 overflow-hidden">
              <p className="text-xs font-semibold text-teal-700 px-4 pt-3 pb-1">Draft reply — edit before sending</p>
              <textarea
                value={draftBody}
                onChange={e => setDraftBody(e.target.value)}
                rows={5}
                className="w-full bg-transparent px-4 pb-3 text-sm text-gray-800 focus:outline-none resize-none"
              />
            </div>
          )}

          {confirming.cards.map((card, i) => (
            <ResultCard key={i} card={card} index={i} />
          ))}
          <div className="flex gap-3 mt-1">
            <button onClick={executeAction}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: '#0d9488' }}>
              Confirm
            </button>
            <button onClick={reset}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reply input panel */}
      {replyCard && (
        <div className="w-full rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          style={{ animation: 'orla-card-in 0.25s ease both' }}>
          <div className="px-4 pt-4 pb-2 border-b border-gray-100">
            <p className="text-xs text-gray-400">Replying to</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{replyCard.title}</p>
            <p className="text-xs text-gray-400 truncate">{replyCard.meta}</p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="What would you like to say? Orla will draft the reply."
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-300 resize-none placeholder:text-gray-400"
            />
            <div className="flex gap-2">
              <button onClick={submitReplyDraft} disabled={!replyText.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-colors"
                style={{ background: '#0d9488' }}>
                Draft reply
              </button>
              <button onClick={() => { setReplyCard(null); setReplyText('') }}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note input panel */}
      {noteCard && (
        <div className="w-full rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          style={{ animation: 'orla-card-in 0.25s ease both' }}>
          <div className="px-4 pt-4 pb-2 border-b border-gray-100">
            <p className="text-xs text-gray-400">Adding note to</p>
            <p className="text-sm font-semibold text-gray-800">{noteCard.bookingName}</p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Type your note…"
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-300 resize-none placeholder:text-gray-400"
            />
            <div className="flex gap-2">
              <button onClick={submitNote} disabled={!noteText.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-colors"
                style={{ background: '#0d9488' }}>
                Add note
              </button>
              <button onClick={() => { setNoteCard(null); setNoteText('') }}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Answer cards + suggestions */}
      {state === 'answered' && (
        <div className="w-full flex flex-col gap-3">
          {summary && <p className="text-sm text-gray-500 px-1">{summary}</p>}
          {cards.map((card, i) => (
            <ResultCard
              key={i} card={card} index={i}
              onReply={c => { setReplyCard(c); setReplyText('') }}
              onBookingAction={triggerBookingAction}
            />
          ))}

          {/* Follow-up suggestion chips */}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => submitQuery(s)}
                  className="px-3.5 py-2 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-full hover:bg-teal-100 transition-colors"
                  style={{ animation: `orla-chip-in 0.25s ease both`, animationDelay: `${i * 60}ms` }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <button onClick={reset} className="mt-1 text-xs text-gray-400 hover:text-gray-600 transition-colors self-start px-1">
            Ask another question →
          </button>
        </div>
      )}

      {error && <p className="text-sm text-rose-500 text-center">{error}</p>}

      {/* Text input */}
      <form onSubmit={handleTextSubmit} className="w-full">
        <div
          className="flex items-stretch w-full border border-gray-200 bg-white shadow-sm overflow-hidden transition-all focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100"
          style={{ borderRadius: '9999px', opacity: isThinking || isListening ? 0.5 : 1 }}>
          <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
            placeholder="Or type your question…" disabled={isThinking || isListening}
            className="flex-1 bg-transparent pl-5 pr-2 py-3 text-sm placeholder:text-gray-400 focus:outline-none" />
          <button type="submit" disabled={!textInput.trim() || isThinking || isListening}
            className="shrink-0 px-5 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#0d9488' }}>
            Ask
          </button>
        </div>
      </form>

      {/* Quick link — idle only */}
      {state === 'idle' && (
        <div className="w-full border-t border-gray-100 pt-4">
          <Link href="/dashboard/bookings"
            className="flex items-center gap-3 w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            <CalendarIcon />
            Today&apos;s Bookings
            <svg className="ml-auto w-4 h-4 text-gray-300" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Card component ──────────────────────────────────────────────────────────

const CARD_ACCENT: Record<string, string> = {
  email:   '#0d9488',
  booking: '#3b82f6',
  info:    '#a8a29e',
}

function EmailIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="14" height="11" rx="1.5"/><path d="M2 7l7 5 7-5"/>
    </svg>
  )
}

function BookingIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
      <rect x="2" y="4" width="14" height="11" rx="1.5"/><path d="M6 2v4M12 2v4M2 8h14"/>
    </svg>
  )
}

function InfoIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
      <circle cx="9" cy="9" r="7"/><path d="M9 8v5M9 6v.5"/>
    </svg>
  )
}

function ResultCard({
  card, index,
  onReply,
  onBookingAction,
}: {
  card: OrlaCard
  index: number
  onReply?: (card: OrlaCard) => void
  onBookingAction?: (card: OrlaCard, action: 'cancel_booking' | 'no_show' | 'add_note') => void
}) {
  const accent = CARD_ACCENT[card.type] ?? CARD_ACCENT.info
  const icon = card.type === 'email' ? <EmailIcon color={accent} />
             : card.type === 'booking' ? <BookingIcon color={accent} />
             : <InfoIcon color={accent} />

  const hasBookingActions = card.type === 'booking' && !!card.bookingId
  const hasReply = card.type === 'email' && !!card.emailId && onReply

  return (
    <div
      className="w-full rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden"
      style={{ borderLeft: `3px solid ${accent}`, animation: 'orla-card-in 0.3s ease both', animationDelay: `${index * 80}ms` }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">{card.title}</p>
            {card.meta && <p className="text-xs text-gray-400 mt-0.5">{card.meta}</p>}
            <div className="mt-1.5 text-sm text-gray-600 leading-relaxed">
              {card.body.split('\n').filter(Boolean).map((line, i) => (
                <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Email action */}
        {hasReply && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button onClick={() => onReply(card)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#0d9488', background: '#f0fdfa' }}>
              Reply
            </button>
          </div>
        )}

        {/* Booking actions */}
        {hasBookingActions && onBookingAction && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3">
            <button onClick={() => onBookingAction(card, 'cancel_booking')}
              className="text-xs text-gray-400 hover:text-rose-500 transition-colors font-medium">
              Cancel
            </button>
            <span className="text-gray-200">·</span>
            <button onClick={() => onBookingAction(card, 'no_show')}
              className="text-xs text-gray-400 hover:text-amber-500 transition-colors font-medium">
              No-show
            </button>
            <span className="text-gray-200">·</span>
            <button onClick={() => onBookingAction(card, 'add_note')}
              className="text-xs text-gray-400 hover:text-blue-500 transition-colors font-medium">
              Add note
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="2" y="4" width="14" height="11" rx="1.5"/><path d="M6 2v4M12 2v4M2 8h14"/>
    </svg>
  )
}
