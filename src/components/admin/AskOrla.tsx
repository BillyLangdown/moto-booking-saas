'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import type { Booking } from '@/types'

type State = 'idle' | 'listening' | 'thinking' | 'answered'

export default function AskOrla({ bookings }: { bookings: Booking[] }) {
  const [state, setState] = useState<State>('idle')
  const [transcript, setTranscript] = useState('')
  const [textInput, setTextInput] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef<unknown>(null)
  const transcriptRef = useRef('')

  async function submitQuery(query: string) {
    if (!query.trim()) return
    setState('thinking')
    setError('')
    try {
      const res = await fetch('/api/orla-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, bookings }),
      })
      if (!res.ok) throw new Error('failed')
      const data = (await res.json()) as { answer: string }
      setAnswer(data.answer)
      setState('answered')
    } catch {
      setError('Something went wrong. Please try again.')
      setState('idle')
    }
  }

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setError('Voice input is not supported in this browser. Use the text input below.')
      return
    }
    transcriptRef.current = ''
    setTranscript('')
    setAnswer('')
    setError('')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SR() as any
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setState('listening')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const t = Array.from(e.results as any[])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) => r[0].transcript)
        .join('')
      transcriptRef.current = t
      setTranscript(t)
    }
    recognition.onend = () => {
      const q = transcriptRef.current
      if (q) submitQuery(q)
      else setState('idle')
    }
    recognition.onerror = () => {
      setState('idle')
      setError('Could not capture audio. Try the text input below.')
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function handleVoiceClick() {
    if (state === 'listening') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(recognitionRef.current as any)?.stop()
    } else if (state === 'idle' || state === 'answered') {
      startListening()
    }
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = textInput.trim()
    if (!q) return
    setTranscript(q)
    submitQuery(q)
    setTextInput('')
  }

  function reset() {
    setState('idle')
    setTranscript('')
    setAnswer('')
    setError('')
  }

  const isListening = state === 'listening'
  const isThinking = state === 'thinking'

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center gap-8 py-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Ask Orla</h1>
        <p className="text-sm text-gray-500 mt-1">Ask anything about your bookings</p>
      </div>

      {/* Voice circle */}
      <div className="relative flex items-center justify-center">
        {isListening && (
          <span className="absolute inset-0 rounded-full bg-accent/30 animate-ping" />
        )}
        <button
          onClick={handleVoiceClick}
          disabled={isThinking}
          className={[
            'relative flex h-32 w-32 items-center justify-center rounded-full transition-all duration-300 focus:outline-none',
            isListening
              ? 'bg-accent text-white scale-110'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600',
            isThinking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          ].join(' ')}
          aria-label={isListening ? 'Stop listening' : 'Press to speak'}
        >
          <MicIcon />
        </button>
      </div>

      <p className="text-sm text-gray-400 -mt-4 min-h-[20px] text-center">
        {state === 'idle' && 'Press to speak'}
        {state === 'listening' && 'Listening… tap to stop'}
        {state === 'thinking' && 'Thinking…'}
        {state === 'answered' && ' '}
      </p>

      {transcript && (
        <div className="w-full rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400 mb-1">You asked</p>
          <p className="text-sm text-gray-700">{transcript}</p>
        </div>
      )}

      {answer && (
        <div className="w-full rounded-xl bg-accent/8 border border-accent/20 px-4 py-4">
          <p className="text-xs font-medium text-accent mb-2">Orla</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{answer}</p>
          <button
            onClick={reset}
            className="mt-3 text-xs text-gray-400 hover:text-accent transition-colors"
          >
            Ask another question →
          </button>
        </div>
      )}

      {error && <p className="text-sm text-rose-500 text-center">{error}</p>}

      <form onSubmit={handleTextSubmit} className="w-full flex gap-2">
        <input
          type="text"
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          placeholder="Or type your question…"
          disabled={isThinking || isListening}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 disabled:opacity-50 disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={!textInput.trim() || isThinking || isListening}
          className="rounded-lg px-4 py-2.5 text-sm font-medium bg-accent text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Ask
        </button>
      </form>

      <div className="w-full border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400 mb-3">Quick actions</p>
        <Link
          href="/dashboard/bookings"
          className="flex items-center gap-3 w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <CalendarIcon />
          Today&apos;s Bookings
          <svg
            className="ml-auto w-4 h-4 text-gray-300"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 4l4 4-4 4" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

function MicIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0014 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="9" y1="22" x2="15" y2="22" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <rect x="2" y="4" width="14" height="11" rx="1.5" />
      <path d="M6 2v4M12 2v4M2 8h14" />
    </svg>
  )
}
