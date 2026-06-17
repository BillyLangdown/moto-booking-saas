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
      const emails = await searchGmail(tenant.id, query, 5)
      if (emails.length) {
        const emailLines = emails.map(e =>
          `• From: ${e.from}\n  Subject: ${e.subject}\n  Preview: ${e.snippet}`
        )
        gmailSection = `\nRecent emails matching this query:\n${emailLines.join('\n\n')}`
      }
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: `You are Orla, a friendly and concise assistant for a booking business. Answer the user's question using the booking data and any email context provided. Be helpful and specific. Keep answers short and easy to read. If nothing matches, say so clearly.`,
      messages: [
        {
          role: 'user',
          content: `Bookings:\n${bookingLines.length ? bookingLines.join('\n') : 'No bookings yet.'}${gmailSection}\n\nQuestion: ${query}`,
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
