import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthTenant } from '@/lib/auth'
import { searchGmail } from '@/lib/google'
import type { Booking, AvailabilitySlot } from '@/types'
import type { GmailSnippet } from '@/lib/google'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const tenant = await getAuthTenant()

  try {
    const body = (await req.json()) as {
      query: string
      bookings: Booking[]
      slots: AvailabilitySlot[]
      lastEmails: GmailSnippet[]
    }
    const { query, bookings, slots, lastEmails } = body

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Format bookings for Claude
    const bookingLines = bookings.map(b => {
      const parts: string[] = [`• [ID:${b.id}] ${b.name}`]
      if (b.slot?.date) parts.push(`on ${b.slot.date}`)
      if (b.slot?.startTime) parts.push(`at ${b.slot.startTime}`)
      if (b.slot?.endTime) parts.push(`– ${b.slot.endTime}`)
      if (b.sessionType) parts.push(`(${b.sessionType})`)
      if (b.status !== 'confirmed') parts.push(`[${b.status}]`)
      if (b.email) parts.push(`email: ${b.email}`)
      if (b.phone) parts.push(`phone: ${b.phone}`)
      if (b.notes) parts.push(`notes: ${b.notes}`)
      return parts.join(' ')
    })

    // Format available slots for Claude (for create_booking and block_time)
    const slotLines = slots.map(s =>
      `• [SLOT:${s.id}] ${s.sessionType} · ${s.date} · ${s.startTime}–${s.endTime} · spaces: ${s.capacity - s.booked}`
    )

    // Format stored emails from previous search (for reply_email)
    const emailLines = lastEmails.map((e, i) =>
      `• [EMAIL:${i}] id:${e.id} threadId:${e.threadId} messageId:${e.messageId}\n  From: ${e.from} | Subject: ${e.subject}\n  Preview: ${e.snippet}`
    )

    // Gmail search — only if tenant has Google connected
    let gmailSection = ''
    let freshEmails: GmailSnippet[] = []
    if (tenant.googleConnected) {
      try {
        const kwMsg = await anthropic.messages.create({
          model: 'claude-haiku-4-5',
          max_tokens: 40,
          system: 'Extract the core search topic from the message and return 3-5 individual keywords joined with OR for a Gmail search. Prefer single words. Only include genuinely related terms. Reply with just the query string, nothing else. Example: "motorbike OR motorcycle OR CBT OR DAS OR riding"',
          messages: [{ role: 'user', content: query }],
        })
        const gmailQuery = kwMsg.content[0].type === 'text' ? kwMsg.content[0].text.trim() : query
        freshEmails = await searchGmail(tenant.id, gmailQuery, 5)

        if (freshEmails.length) {
          const lines = freshEmails.map((e, i) =>
            `• [EMAIL:${i}] id:${e.id} threadId:${e.threadId} messageId:${e.messageId}\n  From: ${e.from} | Subject: ${e.subject}\n  Preview: ${e.snippet}`
          )
          gmailSection = `\nEmails found:\n${lines.join('\n\n')}`
        } else {
          gmailSection = `\nEmail access: connected (no emails matched this search)`
        }
      } catch (gmailErr) {
        console.error('[orla-query] Gmail search error:', gmailErr)
        gmailSection = `\nEmail access: connected but search failed — user may need to reconnect Google in Settings`
      }
    } else {
      gmailSection = `\nEmail access: not connected`
    }

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1536,
      system: `You are Orla, a friendly assistant for a booking business. Today's date is ${today}.

Respond ONLY with valid JSON — no markdown, no text outside the JSON.

For QUESTIONS, respond:
{ "type": "answer", "summary": "short friendly intro", "cards": [...], "suggestions": ["up to 3 short follow-up action suggestions"] }

For ACTIONS (cancel, confirm, no-show, add note, send reminder, create booking, block time, reply to email), respond:
{ "type": "action", "intent": { ...fields... }, "preview": "Human-readable confirmation question", "cards": [...] }

CARD FORMATS — always include action metadata fields when available:
- Email: { "type":"email", "title":"subject", "meta":"From: name", "body":"1 sentence preview only", "emailId":"...", "emailThreadId":"...", "emailMessageId":"...", "emailFrom":"email@address", "emailSubject":"subject" }
- Booking: { "type":"booking", "title":"customer name", "meta":"date · time · session type", "body":"status in 1-3 words e.g. Confirmed / Pending payment / No-show", "bookingId":"<from [ID:...]>", "bookingName":"name", "bookingEmail":"email" }
- Info: { "type":"info", "title":"short heading", "body":"1-2 sentences max" }

IMPORTANT CARD RULES:
- Each booking or email is its own card — never list multiple in one card body
- Keep body text to 1-2 sentences or a few key facts — no long paragraphs
- Use title and meta to carry the main info, body only for the key detail
- If there are many results (5+), show the most relevant 4-5 and summarise the rest in the summary field

ACTION INTENT SCHEMAS:
- cancel_booking:  { "action":"cancel_booking",  "bookingId":"<[ID:...]>", "bookingName":"..." }
- confirm_booking: { "action":"confirm_booking", "bookingId":"<[ID:...]>", "bookingName":"..." }
- no_show:         { "action":"no_show",         "bookingId":"<[ID:...]>", "bookingName":"..." }
- add_note:        { "action":"add_note",        "bookingId":"<[ID:...]>", "bookingName":"...", "note":"..." }
- send_reminder:   { "action":"send_reminder",   "bookingId":"<[ID:...]>", "bookingName":"...", "email":"..." }
- create_booking:  { "action":"create_booking",  "slotId":"<[SLOT:...]>", "name":"...", "email":"...", "phone":"...", "sessionType":"...", "startTime":"ISO", "endTime":"ISO" }
- block_time:      { "action":"block_time",       "slotIds":["<SLOT ids>"], "description":"..." }
- reply_email:     { "action":"reply_email",      "threadId":"...", "inReplyToMessageId":"...", "to":"...", "subject":"...", "body":"full drafted reply text" }

DAILY RUNDOWN: If asked for a daily rundown or briefing, structure cards as: (1) recent emails likely needing a reply — email cards with full metadata, (2) today's bookings — booking cards, (3) recent cancellations or pending bookings. Keep summary brief and business-like.

RULES:
- Always include bookingId/bookingName/bookingEmail on booking cards, and all email* fields on email cards — these power the action buttons in the UI
- Use IDs from [ID:...] markers only — never invent IDs
- For reply_email, draft a professional friendly reply based on the user's instruction
- Suggestions should be short (under 6 words each) and directly actionable given what was just returned
- If email not connected, use an info card telling user to connect Google in Settings`,
      messages: [
        {
          role: 'user',
          content: [
            `Bookings:\n${bookingLines.length ? bookingLines.join('\n') : 'No bookings yet.'}`,
            slotLines.length ? `\nAvailable slots:\n${slotLines.join('\n')}` : '',
            emailLines.length ? `\nPrevious email results:\n${emailLines.join('\n\n')}` : '',
            gmailSection,
            `\nQuestion/Command: ${query}`,
          ].join(''),
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    let parsed: Record<string, unknown> = {}
    try {
      parsed = JSON.parse(cleaned) as Record<string, unknown>
    } catch {
      return NextResponse.json({
        type: 'answer',
        summary: '',
        cards: [{ type: 'info', title: 'Orla', body: raw }],
        emails: [],
      })
    }

    // Include fresh email results so client can store them for follow-up reply actions
    return NextResponse.json({ ...parsed, emails: freshEmails })
  } catch (err) {
    console.error('[orla-query]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
