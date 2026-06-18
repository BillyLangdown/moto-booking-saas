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
      // Strip conversational filler so Gmail gets clean keywords
      const gmailQuery = query
        .replace(/can you|please|look through|find|search|my emails?|anything|related to|about|for me/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
      const emails = await searchGmail(tenant.id, gmailQuery || query, 5)
      if (emails.length) {
        const emailLines = emails.map(e =>
          `• From: ${e.from}\n  Subject: ${e.subject}\n  Preview: ${e.snippet}`
        )
        gmailSection = `\nEmails found:\n${emailLines.join('\n\n')}`
      } else {
        gmailSection = `\nEmail access: connected (no emails matched this search)`
      }
    } else {
      gmailSection = `\nEmail access: not connected`
    }

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: `You are Orla, a friendly and concise assistant for a booking business. Today's date is ${today}. Answer the user's question using the booking data and email context provided. If email access shows as not connected, tell the user their emails are not connected — they can connect them in Settings. If email access is connected but no emails matched, say so. Keep answers short and easy to read.`,
      messages: [
        {
          role: 'user',
          content: `Bookings:\n${bookingLines.length ? bookingLines.join('\n') : 'No bookings yet.'}\n${gmailSection}\n\nQuestion: ${query}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ answer: text })
  } catch (err) {
    console.error('[orla-query]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
