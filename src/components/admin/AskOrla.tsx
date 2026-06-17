'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { Booking } from '@/types'

type State = 'idle' | 'listening' | 'thinking' | 'answered'

const GAZE = [
  { x: 0,  y: 0  },
  { x: 7,  y: 0  },
  { x: -7, y: 0  },
  { x: 4,  y: -3 },
  { x: -4, y: -3 },
  { x: 3,  y: 3  },
  { x: 0,  y: -3 },
]

// Eye arc geometry — bottom half arc (◡) in all states
const EYE_R    = 13
const EYE_CIRC = 2 * Math.PI * EYE_R          // ≈ 81.68
const ARC_HALF = EYE_CIRC / 2                  // ≈ 40.84

export default function AskOrla({ bookings }: { bookings: Booking[] }) {
  const [state, setState]       = useState<State>('idle')
  const [transcript, setTranscript] = useState('')
  const [textInput, setTextInput]   = useState('')
  const [answer, setAnswer]         = useState('')
  const [error, setError]           = useState('')
  const [isBlinking, setIsBlinking] = useState(false)
  const [gaze, setGaze]             = useState({ x: 0, y: 0 })

  const recognitionRef = useRef<unknown>(null)
  const transcriptRef  = useRef('')
  const blinkTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gazeTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Blink
  useEffect(() => {
    if (state !== 'idle' && state !== 'answered') {
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
  }, [state])

  // Gaze drift — snaps to centre when active
  useEffect(() => {
    if (state === 'listening' || state === 'thinking') {
      setGaze({ x: 0, y: 0 })
      return
    }
    function scheduleGaze() {
      gazeTimerRef.current = setTimeout(() => {
        setGaze(GAZE[Math.floor(Math.random() * GAZE.length)])
        scheduleGaze()
      }, 2500 + Math.random() * 3500)
    }
    scheduleGaze()
    return () => { if (gazeTimerRef.current) clearTimeout(gazeTimerRef.current) }
  }, [state])

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
    recognition.continuous   = false
    recognition.interimResults = true
    recognition.lang         = 'en-US'
    recognition.onstart  = () => setState('listening')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('')
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
  const isThinking  = state === 'thinking'
  const isIdle      = state === 'idle' || state === 'answered'

  // Eye stroke colour
  const eyeStroke = isListening ? '#0d9488' : '#a8a29e'

  // ◡ arc in all states
  const eyeDashArray  = `${ARC_HALF} ${ARC_HALF}`
  const eyeDashOffset = `${ARC_HALF}`

  // Blink via scaleY on the eye group
  const eyeScaleY = isBlinking ? 0 : 1

  return (
    <div className="w-full flex flex-col items-center gap-8">
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
        @keyframes orla-transcript-in {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .orla-breathe       { animation: orla-breathe 5s ease-in-out infinite; }
        .orla-listen-pulse  { animation: orla-listen-pulse 3s ease-in-out infinite; }
        .orla-think-dot-1   { animation: orla-think-dot 1.8s ease-in-out infinite 0s; }
        .orla-think-dot-2   { animation: orla-think-dot 1.8s ease-in-out infinite 0.25s; }
        .orla-think-dot-3   { animation: orla-think-dot 1.8s ease-in-out infinite 0.5s; }
        .orla-transcript    { animation: orla-transcript-in 0.25s ease; }
      `}</style>

      {/* Orb */}
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        <button
          onClick={handleVoiceClick}
          disabled={isThinking}
          className={[
            'relative flex items-center justify-center transition-all duration-700 focus:outline-none',
            isListening ? 'orla-listen-pulse' : isIdle ? 'orla-breathe' : '',
            isThinking ? 'cursor-not-allowed' : 'cursor-pointer',
          ].join(' ')}
          style={{
            width: 160, height: 160,
            borderRadius: '50%',
            overflow: 'hidden',
            background: isListening
              ? 'linear-gradient(135deg, #f0fdfa 0%, #99f6e4 100%)'
              : isThinking
              ? 'linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%)'
              : 'linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%)',
            boxShadow: isIdle
              ? '0 4px 24px rgba(0,0,0,0.07)'
              : undefined,
          }}
          aria-label={isListening ? 'Stop listening' : 'Press to speak'}
        >
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none">

            {/* Left eye — gaze wrapper, then arc + pupil both blink together */}
            <g style={{ transform: `translate(${gaze.x}px, ${gaze.y}px)`, transition: 'transform 0.9s ease' }}>
              <circle
                cx="30" cy="40" r={EYE_R}
                stroke={eyeStroke}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={eyeDashArray}
                strokeDashoffset={eyeDashOffset}
                style={{
                  transformOrigin: '30px 40px',
                  transform: `scaleY(${eyeScaleY})`,
                  transition: isBlinking ? 'transform 0.09s ease, stroke 0.5s ease' : 'transform 0.07s ease, stroke 0.5s ease',
                }}
              />
            </g>

            {/* Right eye */}
            <g style={{ transform: `translate(${gaze.x}px, ${gaze.y}px)`, transition: 'transform 0.9s ease' }}>
              <circle
                cx="70" cy="40" r={EYE_R}
                stroke={eyeStroke}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={eyeDashArray}
                strokeDashoffset={eyeDashOffset}
                style={{
                  transformOrigin: '70px 40px',
                  transform: `scaleY(${eyeScaleY})`,
                  transition: isBlinking ? 'transform 0.09s ease, stroke 0.5s ease' : 'transform 0.07s ease, stroke 0.5s ease',
                }}
              />
            </g>

            {/* Thinking dots */}
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

      {/* Status */}
      <div className="-mt-4 flex flex-col items-center gap-3 w-full">
        <p className="text-sm min-h-[20px] text-center transition-colors duration-300"
          style={{ color: isListening ? '#0d9488' : '#9ca3af' }}>
          {state === 'idle'      && 'Tap Orla to ask a question'}
          {state === 'listening' && 'Listening… tap to stop'}
          {state === 'thinking'  && 'On it…'}
          {state === 'answered'  && 'Tap to ask something else'}
        </p>

        {isListening && transcript && (
          <div key={transcript} className="orla-transcript w-full rounded-2xl px-5 py-3.5 text-center"
            style={{ background: '#f0fdfa', border: '1px solid #99f6e4' }}>
            <p className="text-base text-gray-700 leading-snug">{transcript}</p>
          </div>
        )}
      </div>

      {transcript && !isListening && (
        <div className="w-full rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400 mb-1">You asked</p>
          <p className="text-sm text-gray-700">{transcript}</p>
        </div>
      )}

      {answer && (
        <div className="w-full rounded-xl px-4 py-4"
          style={{ background: '#f0fdfa', border: '1px solid #ccfbf1' }}>
          <p className="text-xs font-medium mb-2" style={{ color: '#0d9488' }}>Orla</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{answer}</p>
          <button onClick={reset} className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Ask another question →
          </button>
        </div>
      )}

      {error && <p className="text-sm text-rose-500 text-center">{error}</p>}

      <form onSubmit={handleTextSubmit} className="w-full">
        <div
          className="flex items-stretch w-full border border-gray-200 bg-white shadow-sm overflow-hidden transition-all focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100"
          style={{ borderRadius: '9999px', opacity: isThinking || isListening ? 0.5 : 1 }}
        >
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Or type your question…"
            disabled={isThinking || isListening}
            className="flex-1 bg-transparent pl-5 pr-2 py-3 text-sm placeholder:text-gray-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isThinking || isListening}
            className="shrink-0 px-5 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#0d9488' }}
          >
            Ask
          </button>
        </div>
      </form>

      {!isListening && !isThinking && (
        <div className="w-full border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400 mb-3">Quick actions</p>
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

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="2" y="4" width="14" height="11" rx="1.5" />
      <path d="M6 2v4M12 2v4M2 8h14" />
    </svg>
  )
}
