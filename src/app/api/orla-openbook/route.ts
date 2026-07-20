import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { tenantService } from '@/services/tenantService'
import { bookingService } from '@/services/bookingService'
import { getGoogleFreeBusy } from '@/lib/google'
import type { Booking } from '@/types'

const anthropic = new Anthropic()

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  tenantSlug: string
  messages: Message[]
}

const DEFAULT_INTAKE = `Collect the following information before submitting the enquiry:
- Full name
- Email address
- Phone number
- A description of what they need
- Their preferred date or timeframe`

interface BusyPeriod { start: string; end: string }

function formatFreeBusy(periods: BusyPeriod[]): string {
  if (!periods.length) return ''
  const lines = periods.map(p => {
    const start = new Date(p.start)
    const end   = new Date(p.end)
    const date  = start.toISOString().slice(0, 10)
    const from  = start.toISOString().slice(11, 16)
    const to    = end.toISOString().slice(11, 16)
    return `• ${date} ${from}–${to} (blocked in Google Calendar)`
  })
  return `\nBlocked times (already in Google Calendar — do not suggest these):\n${lines.join('\n')}\n`
}

function formatSchedule(bookings: Booking[]): string {
  const today = new Date().toISOString().split('T')[0]

  // Only include upcoming confirmed/pending bookings that have date info
  const upcoming = bookings
    .filter(b => b.status !== 'cancelled' && b.status !== 'awaiting_payment')
    .filter(b => {
      // Slotted bookings have slot.date; open-book have proposedDate
      const date = b.slot?.date ?? b.proposedDate
      return date && date >= today
    })
    .sort((a, b) => {
      const da = a.slot?.date ?? a.proposedDate ?? ''
      const db = b.slot?.date ?? b.proposedDate ?? ''
      return da.localeCompare(db)
    })

  if (!upcoming.length) return ''

  const lines = upcoming.map(b => {
    const date  = b.slot?.date      ?? b.proposedDate ?? 'TBC'
    const start = b.slot?.startTime ?? b.proposedTime ?? ''
    const type  = b.sessionType     ?? ''
    const name  = b.name
    const status = b.status === 'pending' ? ' (pending confirmation)' : ''
    const timeStr = start ? ` at ${start}` : ''
    const typeStr = type  ? ` — ${type}` : ''
    return `• ${date}${timeStr}${typeStr}, ${name}${status}`
  })

  return `\nExisting schedule (upcoming bookings):\n${lines.join('\n')}\n`
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody
    const { tenantSlug, messages } = body

    if (!tenantSlug || !messages?.length) {
      return NextResponse.json({ error: 'tenantSlug and messages are required' }, { status: 400 })
    }

    const tenant = await tenantService.getTenantBySlug(tenantSlug)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const allBookings = await bookingService.getBookings(tenant.id)

    // Fetch Google Calendar blocks for the next 30 days so Orla avoids already-busy times
    let freeBusySection = ''
    if (tenant.googleConnected) {
      const timeMin = new Date().toISOString()
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const busyPeriods = await getGoogleFreeBusy(tenant.id, timeMin, timeMax)
      freeBusySection = formatFreeBusy(busyPeriods)
    }

    const today = new Date().toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    const scheduleSection      = formatSchedule(allBookings)
    const businessContext      = tenant.orlaBusinessContext?.trim()
      ? `\nAbout this business:\n${tenant.orlaBusinessContext.trim()}\n`
      : ''
    const availabilitySection  = tenant.generalAvailability?.trim()
      ? `\nWorking hours:\n${tenant.generalAvailability.trim()}\n`
      : ''
    const intakeInstructions   = tenant.orlaIntakePrompt?.trim() || DEFAULT_INTAKE

    const systemPrompt = `You are Orla, the booking assistant for ${tenant.name}. Today is ${today}.

Your job is to have a short, efficient chat with a potential customer, understand what they need, agree a date that works around the existing schedule, and collect what's needed to submit a real booking request to ${tenant.name}'s team.
${businessContext}${availabilitySection}${scheduleSection}${freeBusySection}
What to collect:
${intakeInstructions}

HOW TO BEHAVE:
- Be warm and natural, but brief. Most replies should be 1-2 short sentences, occasionally 3. Don't pad with extra pleasantries, don't restate things already said, and don't over-explain
- Ask for one thing at a time (or two closely related things, e.g. name and email together) — never a long list of questions in one message
- Offer multiple-choice options whenever there's a natural short list of answers — picking a service, choosing between a couple of available dates, a yes/no question. Put 2-4 short options in the "options" field instead of spelling them out in the reply text. Omit "options" when there's no natural short list (e.g. asking for their name)
- Look at the existing schedule when dates come up. If a customer suggests a date that clashes, say so briefly and suggest the next available window
- Once a date is agreed and all required details are collected (including name, email, and phone), your final reply should confirm everything back in one short, plain summary AND let them know their request has been sent to ${tenant.name} and they'll hear back by email, usually within one working day. Confirming and submitting happen in the same turn — don't ask a separate "shall I send this?" question first
- When you have everything, respond with this exact JSON:
  { "complete": true, "reply": "...", "name": "...", "email": "...", "phone": "...", "sessionType": "...", "proposedDate": "YYYY-MM-DD", "proposedTime": "HH:MM", "chatSummary": "A concise summary of the customer's requirements and agreed date/time for the team to review." }
- While still gathering information, respond with:
  { "complete": false, "reply": "...", "options": ["...", "..."] }
  Omit "options" entirely when there isn't a natural short list to offer

STRICT FORMATTING RULES:
- Always respond with a single valid JSON object. Nothing before or after it, no code fences, no markdown
- In the reply field, use plain conversational text only. No asterisks, no bold, no bullet points, no markdown of any kind
- Never use em dashes (the long dash: --). Use a comma, full stop, or rewrite the sentence instead
- When confirming details back to the customer, write them as natural sentences, not a formatted list`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''

    let parsed: Record<string, unknown> | null = null

    // Try 1: direct parse after stripping outer code fences
    try {
      const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
      parsed = JSON.parse(stripped) as Record<string, unknown>
    } catch { /* fall through */ }

    // Try 2: extract the first {...} block in case Claude added prose around it
    if (!parsed) {
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        try { parsed = JSON.parse(match[0]) as Record<string, unknown> } catch { /* fall through */ }
      }
    }

    // Fallback: treat the whole raw text as the reply
    if (!parsed) {
      parsed = { complete: false, reply: raw }
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[orla-openbook]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
