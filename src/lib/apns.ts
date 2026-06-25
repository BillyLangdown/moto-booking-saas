import http2 from 'node:http2'
import { createSign } from 'node:crypto'
import { adminSupabase } from '@/lib/supabase/admin'

const APNS_HOST = 'https://api.push.apple.com'

function makeJwt(teamId: string, keyId: string, privateKey: string): string {
  const header  = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) })).toString('base64url')
  const signing = `${header}.${payload}`
  const signer  = createSign('SHA256')
  signer.update(signing)
  // ieee-p1363 gives the r||s format APNs expects (not DER)
  const sig = signer.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' })
  return `${signing}.${sig.toString('base64url')}`
}

function sendOne(deviceToken: string, jwt: string, bundleId: string, payloadStr: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(APNS_HOST)
    client.on('error', reject)

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${deviceToken}`,
      'authorization': `bearer ${jwt}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(payloadStr).toString(),
    })

    let statusCode = 0
    let body = ''
    req.on('response', (headers) => { statusCode = headers[':status'] as number })
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      client.close()
      if (statusCode === 200) {
        resolve()
      } else {
        console.error(`[apns] Push failed for token …${deviceToken.slice(-8)}: HTTP ${statusCode}`, body)
        reject(new Error(`APNs ${statusCode}: ${body}`))
      }
    })
    req.on('error', reject)
    req.write(payloadStr)
    req.end()
  })
}

export interface PushPayload {
  title: string
  body: string
  /** Extra keys merged into the root of the APNs payload (accessible in the app via userInfo) */
  data?: Record<string, unknown>
}

export async function sendPushToTenant(tenantId: string, push: PushPayload): Promise<void> {
  const teamId    = process.env.APNS_TEAM_ID
  const keyId     = process.env.APNS_KEY_ID
  const bundleId  = process.env.APNS_BUNDLE_ID ?? 'com.williamlangdown.orla'
  const rawKey    = process.env.APNS_PRIVATE_KEY ?? ''
  // Vercel stores newlines as \n literals in env vars
  const privateKey = rawKey.replace(/\\n/g, '\n')

  if (!teamId || !keyId || !privateKey) {
    console.warn('[apns] Missing APNS_TEAM_ID / APNS_KEY_ID / APNS_PRIVATE_KEY — push skipped')
    return
  }

  const { data: rows, error } = await adminSupabase
    .from('device_tokens')
    .select('token')
    .eq('tenant_id', tenantId)

  if (error || !rows || rows.length === 0) return

  const jwt = makeJwt(teamId, keyId, privateKey)
  const payloadStr = JSON.stringify({
    aps: {
      alert: { title: push.title, body: push.body },
      sound: 'default',
    },
    ...(push.data ?? {}),
  })

  await Promise.allSettled(
    rows.map((r) => sendOne((r as { token: string }).token, jwt, bundleId, payloadStr))
  )
}
