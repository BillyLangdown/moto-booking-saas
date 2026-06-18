import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthTenant } from '@/lib/auth'
import { searchGmail } from '@/lib/google'
import type { Booking } from '@/types'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  // Run auth outside try/catch so redirect() can propagate correctly
  const tenant = await getAuthTenant()

  try {
    const body = (await req.json()) as { query: string; bookings: Booking[] }
    const { query, bookings } = body

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Booking context
    const bookingLines = bookings.map(b => {
      const parts: string[] = [`• ${b.name}`]
      if (b.slot?.date) parts.push(`on ${b.slot.date}`)
      if (b.slot?.startTime) parts.push(`at ${b.slot.startTime}`)
      if (b.slot?.endTime) parts.push(`– ${b.slot.endTime}`)
      if (b.sessionType) parts.push(`(${b.sessionType})`)
      if (b.status !== 'confirmed') parts.push(`[${b.status}]`)
      if (b.email) parts.push(`email: ${b.email}`)
      if (b.phone) parts.push(`phone: ${b.phone}`)
      if (b.resourceName) parts.push(`resource: ${b.resourceName}`)
      return parts.join(' ')
    })

    // Gmail context — only if tenant has Google connected
    let gmailSection = ''
    if (tenant.googleConnected) {
      try {
        // Build a Gmail OR query using the core terms plus close synonyms
        const kwMsg = await anthropic.messages.create({
          model: 'claude-haiku-4-5',
          max_tokens: 40,
          system: 'Extract the core search topic from the message and return 3-5 individual keywords or short terms joined with OR for a Gmail search. Prefer single words over phrases so Gmail matches broadly. Only include genuinely related terms. Reply with just the query string, nothing else. Example input: "find emails about motorbike tests" → Example output: "motorbike OR motorcycle OR CBT OR DAS OR riding"',
          messages: [{ role: 'user', content: query }],
        })
        const gmailQuery = kwMsg.content[0].type === 'text' ? kwMsg.content[0].text.trim() : query

        const emails = await searchGmail(tenant.id, gmailQuery, 5)
        if (emails.length) {
          const emailLines = emails.map(e =>
            `• From: ${e.from}\n  Subject: ${e.subject}\n  Preview: ${e.snippet}`
          )
          gmailSection = `\nEmails found:\n${emailLines.join('\n\n')}`
        } else {
          gmailSection = `\nEmail access: connected (no emails matched this search)`
        }
      } catch (gmailErr) {
        console.error('[orla-query] Gmail search error:', gmailErr)
        gmailSection = `\nEmail access: connected but search failed — the user may need to reconnect Google in Settings`
      }
    } else {
      gmailSection = `\nEmail access: not connected`
    }

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: `You are Orla, a friendly assistant for a booking business. Today's date is ${today}.

Respond ONLY with a valid JSON object — no markdown, no text outside the JSON.

Format:
{
  "summary": "A short friendly sentence introducing the results",
  "cards": [
    { "type": "email", "title": "email subject", "meta": "From: sender name", "body": "email preview text" },
    { "type": "booking", "title": "customer name", "meta": "date · time · session type", "body": "status" },
    { "type": "info", "title": "short heading", "body": "answer text" }
  ]
}

Rules:
- Use email cards for email results, booking cards for booking results, info cards for general answers
- If nothing is found, return a single info card explaining clearly
- If email access is not connected, return a single info card telling the user to connect Google in Settings
- If email access is connected but no emails matched, say so in an info card
- Keep card body text short and easy to read`,
      messages: [
        {
          role: 'user',
          content: `Bookings:\n${bookingLines.length ? bookingLines.join('\n') : 'No bookings yet.'}\n${gmailSection}\n\nQuestion: ${query}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // Strip markdown code fences if Claude wraps the JSON
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    let summary = ''
    let cards: { type: string; title: string; meta?: string; body: string }[] = []
    try {
      const parsed = JSON.parse(cleaned) as { summary?: string; cards?: typeof cards }
      summary = parsed.summary ?? ''
      cards = Array.isArray(parsed.cards) ? parsed.cards : []
    } catch {
      cards = [{ type: 'info', title: 'Orla', body: raw }]
    }

    return NextResponse.json({ summary, cards })
  } catch (err) {
    console.error('[orla-query]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
