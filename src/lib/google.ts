import { adminSupabase } from '@/lib/supabase/admin'
import type { Booking } from '@/types'

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('[google] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set - Google features will not work')
}

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID ?? ''
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ''

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
].join(' ')

export function getGoogleAuthUrl(tenantId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  redirectUri,
    response_type: 'code',
    access_type:   'offline',
    prompt:        'consent',
    scope:         SCOPES,
    state:         tenantId,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

interface TokenResponse {
  access_token:  string
  refresh_token?: string
  expires_in:    number
}

async function requestToken(body: URLSearchParams): Promise<TokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`Google token request failed: ${await res.text()}`)
  return res.json() as Promise<TokenResponse>
}

async function fetchGoogleEmail(accessToken: string): Promise<string | undefined> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return undefined
  const data = (await res.json()) as { email?: string }
  return data.email
}

export async function connectGoogleAccount(
  tenantId: string,
  code: string,
  redirectUri: string,
): Promise<void> {
  const tokens = await requestToken(new URLSearchParams({
    code,
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri:  redirectUri,
    grant_type:    'authorization_code',
  }))

  if (!tokens.refresh_token) {
    // Google only returns a refresh token on first consent - if the user previously
    // connected and revoked elsewhere, prompt=consent above should still force one.
    throw new Error('Google did not return a refresh token. Disconnect any existing access at myaccount.google.com/permissions and try again.')
  }

  const email  = await fetchGoogleEmail(tokens.access_token)
  const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  const { error } = await adminSupabase
    .from('tenants')
    .update({
      google_access_token:      tokens.access_token,
      google_refresh_token:     tokens.refresh_token,
      google_token_expiry:      expiry,
      google_connected_email:   email ?? null,
      google_calendar_connected: true,
    })
    .eq('id', tenantId)
  if (error) throw new Error(error.message)
}

export async function disconnectGoogleAccount(tenantId: string): Promise<void> {
  const { error } = await adminSupabase
    .from('tenants')
    .update({
      google_access_token:      null,
      google_refresh_token:     null,
      google_token_expiry:      null,
      google_connected_email:   null,
      google_calendar_connected: false,
    })
    .eq('id', tenantId)
  if (error) throw new Error(error.message)
}

interface GoogleTokenRow {
  google_access_token:  string | null
  google_refresh_token: string | null
  google_token_expiry:  string | null
}

async function getValidAccessToken(tenantId: string): Promise<string | null> {
  const { data } = await adminSupabase
    .from('tenants')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('id', tenantId)
    .single()

  const row = data as GoogleTokenRow | null
  if (!row?.google_refresh_token) return null

  const expiresAt = row.google_token_expiry ? new Date(row.google_token_expiry).getTime() : 0
  if (row.google_access_token && expiresAt - Date.now() > 60_000) {
    return row.google_access_token
  }

  const refreshed = await requestToken(new URLSearchParams({
    refresh_token: row.google_refresh_token,
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type:    'refresh_token',
  }))

  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
  await adminSupabase
    .from('tenants')
    .update({ google_access_token: refreshed.access_token, google_token_expiry: newExpiry })
    .eq('id', tenantId)

  return refreshed.access_token
}

export async function createCalendarEvent(
  tenantId: string,
  booking: Booking,
  startTime: string,
  endTime: string,
): Promise<void> {
  const accessToken = await getValidAccessToken(tenantId)
  if (!accessToken) return

  const summary = booking.sessionType ? `${booking.sessionType} - ${booking.name}` : booking.name
  const description = [booking.email, booking.phone, booking.notes].filter(Boolean).join('\n')

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method:  'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary,
      description,
      start: { dateTime: startTime },
      end:   { dateTime: endTime },
    }),
  })

  if (!res.ok) {
    console.error('[google-calendar] failed to create event:', await res.text())
    return
  }

  const event = (await res.json()) as { id?: string }
  if (event.id) {
    await adminSupabase.from('bookings').update({ google_event_id: event.id }).eq('id', booking.id)
  }
}

export async function deleteCalendarEvent(tenantId: string, googleEventId: string): Promise<void> {
  const accessToken = await getValidAccessToken(tenantId)
  if (!accessToken) return

  await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export interface GmailSnippet {
  id:        string
  threadId:  string
  messageId: string  // RFC Message-ID header for reply threading
  subject:   string
  from:      string
  snippet:   string
}

export async function searchGmail(tenantId: string, query: string, maxResults = 5): Promise<GmailSnippet[]> {
  const accessToken = await getValidAccessToken(tenantId)
  if (!accessToken) return []

  const listRes = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!listRes.ok) {
    const errText = await listRes.text()
    console.error('[searchGmail] list failed:', listRes.status, errText)
    throw new Error(`Gmail API error ${listRes.status}: ${errText}`)
  }

  const { messages } = (await listRes.json()) as { messages?: { id: string; threadId: string }[] }
  if (!messages?.length) return []

  const results = await Promise.all(
    messages.map(async (m): Promise<GmailSnippet | null> => {
      const msgRes = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Message-ID`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      if (!msgRes.ok) return null
      const msg = (await msgRes.json()) as { snippet?: string; threadId?: string; payload?: { headers?: { name: string; value: string }[] } }
      const headers = msg.payload?.headers ?? []
      return {
        id:        m.id,
        threadId:  m.threadId,
        messageId: headers.find(h => h.name === 'Message-ID')?.value ?? '',
        subject:   headers.find(h => h.name === 'Subject')?.value ?? '',
        from:      headers.find(h => h.name === 'From')?.value ?? '',
        snippet:   msg.snippet ?? '',
      }
    }),
  )

  return results.filter((r): r is GmailSnippet => r !== null)
}

export async function sendGmailReply(
  tenantId: string,
  fromEmail: string,
  to: string,
  subject: string,
  body: string,
  threadId: string,
  inReplyToMessageId: string,
): Promise<void> {
  const accessToken = await getValidAccessToken(tenantId)
  if (!accessToken) throw new Error('No Google access token — reconnect Google in Settings')

  const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`
  const mime = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${replySubject}`,
    `In-Reply-To: ${inReplyToMessageId}`,
    `References: ${inReplyToMessageId}`,
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\r\n')

  const encoded = Buffer.from(mime).toString('base64url')

  const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
    method:  'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ raw: encoded, threadId }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gmail send failed: ${err}`)
  }
}
