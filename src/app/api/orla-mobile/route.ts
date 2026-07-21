import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { adminSupabase } from '@/lib/supabase/admin'

const anthropic = new Anthropic()

// iOS sends snake_case keys — this shape reflects what actually arrives
interface IosBooking {
  id: string
  name?: string
  email?: string
  phone?: string
  session_type?: string
  status?: string
  notes?: string
  start_time?: string
  proposed_date?: string
  created_at?: string
}

interface IosSlot {
  id: string
  session_type?: string
  start_time?: string
  end_time?: string
  capacity?: number
  booked?: number
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = auth.slice(7)

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token)
  if (authError || !user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRow } = await adminSupabase
    .from('users')
    .select('tenant_id')
    .eq('email', user.email)
    .single()
  if (!userRow?.tenant_id) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
  }

  const { data: tenant } = await adminSupabase
    .from('tenants')
    .select('*')
    .eq('id', userRow.tenant_id)
    .single()

  try {
    const body = await req.json() as { query: string; bookings: IosBooking[]; slots: IosSlot[] }
    const { query, bookings = [], slots = [] } = body

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const todayIso = new Date().toISOString().slice(0, 10)

    // Only include bookings from today onwards.
    // If no appointment date, fall back to created_at — old undated enquiries are treated as past.
    // Cancelled bookings are excluded entirely.
    const relevantBookings = bookings.filter((b: IosBooking) => {
      if (b.status === 'cancelled') return false
      const appointmentDate = b.proposed_date ?? b.start_time?.slice(0, 10)
      if (appointmentDate) return appointmentDate >= todayIso
      // No appointment date — use creation date as proxy (mirrors iOS BookingsView logic)
      const createdDate = b.created_at?.slice(0, 10)
      if (!createdDate) return true
      return createdDate >= todayIso
    })

    const bookingLines = relevantBookings.map(b => {
      const parts: string[] = [`${b.name ?? 'Unknown'}`]
      if (b.session_type) parts.push(`(${b.session_type})`)
      parts.push(`[${b.status ?? 'pending'}]`)
      // Show the date if available
      const date = b.proposed_date ?? b.start_time?.slice(0, 10)
      if (date) parts.push(`date: ${date}`)
      if (b.phone) parts.push(`phone: ${b.phone}`)
      if (b.email) parts.push(`email: ${b.email}`)
      if (b.notes) parts.push(`notes: ${b.notes}`)
      return parts.join(' | ')
    })

    // Only include upcoming slots
    const upcomingSlots = slots.filter(s => {
      if (!s.start_time) return false
      return s.start_time.slice(0, 10) >= todayIso
    })

    const slotLines = upcomingSlots.map(s => {
      const spaces = (s.capacity ?? 0) - (s.booked ?? 0)
      return `${s.session_type ?? 'Session'} · ${s.start_time} to ${s.end_time} · ${spaces} space${spaces === 1 ? '' : 's'} left`
    })

    const today = new Date().toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const bookingMode = (tenant as any)?.booking_mode ?? 'slotted'

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: `You are Orla, a friendly assistant for ${tenant?.name ?? 'a booking business'}. Today is ${today}.
This business uses ${bookingMode === 'open' ? 'open enquiry booking (customers send enquiries, no fixed slots)' : 'fixed slot booking'}.

STRICT FORMATTING RULES - never break these:
- No asterisks (*) ever. Not for bold, not for lists, not for any reason.
- No underscores (_) for emphasis.
- No em dashes or double hyphens.
- No hashtags or headings.
- No markdown of any kind.
- No bullet points or list symbols.
- Write in plain conversational prose, like a text message to a colleague.

When giving a daily rundown:
- Start with whether there is anything booked in for today specifically.
- Then mention any pending enquiries that need a decision.
- Do not mention slots if the business uses open enquiry booking.
- Do not list every booking. Two or three short sentences is enough. Plain text only.`,
      messages: [
        {
          role: 'user',
          content: [
            `Today's date: ${todayIso}`,
            `\nActive bookings (pending enquiries + upcoming confirmed, cancelled excluded):\n${bookingLines.length ? bookingLines.join('\n') : 'None.'}`,
            bookingMode !== 'open' && upcomingSlots.length
              ? `\nUpcoming availability slots:\n${slotLines.join('\n')}`
              : '',
            `\nQuestion: ${query}`,
          ].filter(Boolean).join(''),
        },
      ],
    })

    const answer = message.content[0].type === 'text' ? message.content[0].text : 'No response.'
    return NextResponse.json({ answer })
  } catch (err) {
    console.error('[orla-mobile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
