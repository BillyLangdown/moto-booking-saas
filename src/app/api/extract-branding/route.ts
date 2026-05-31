import { NextRequest, NextResponse } from 'next/server'

function isUsableColor(hex: string): boolean {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 15 && brightness < 245
}

function normaliseHex(raw: string): string | null {
  const s = raw.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(s)) return s.toUpperCase()
  if (/^#[0-9a-f]{3}$/.test(s)) {
    const [, r, g, b] = s
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return null
}

function extractColors(html: string): string[] {
  const found: string[] = []

  // 1. Meta theme-color — most reliable signal
  const themeColor = html.match(/name=["']theme-color["'][^>]+content=["']([^"']+)/i)?.[1]
    ?? html.match(/content=["']([^"']+)["'][^>]*name=["']theme-color["']/i)?.[1]
  if (themeColor) {
    const n = normaliseHex(themeColor.trim())
    if (n) found.push(n)
  }

  // 2. CSS custom properties in <style> blocks that suggest brand colors
  const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1])
  for (const css of styleBlocks) {
    const varMatches = [...css.matchAll(/--(?:primary|brand|accent|main|color-primary|theme|highlight)[^:]*:\s*(#[0-9a-fA-F]{3,6})\b/gi)]
    for (const m of varMatches) {
      const n = normaliseHex(m[1])
      if (n) found.push(n)
    }

    // Header / nav background-color rules
    const selectorMatches = [...css.matchAll(/(?:header|\.header|nav|\.nav|\.navbar|\.top-bar)[^{]*\{([^}]+)\}/gi)]
    for (const m of selectorMatches) {
      const bgMatch = m[1].match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})\b/i)?.[1]
      if (bgMatch) {
        const n = normaliseHex(bgMatch)
        if (n) found.push(n)
      }
    }
  }

  // 3. Inline styles on header / nav elements
  const inlineMatches = [...html.matchAll(/<(?:header|nav)[^>]+style="([^"]+)"/gi)]
  for (const m of inlineMatches) {
    const bgMatch = m[1].match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})\b/i)?.[1]
    if (bgMatch) {
      const n = normaliseHex(bgMatch)
      if (n) found.push(n)
    }
  }

  // Deduplicate and filter out near-white/near-black
  const seen = new Set<string>()
  return found.filter(c => {
    if (seen.has(c)) return false
    seen.add(c)
    return isUsableColor(c)
  })
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json() as { url: string }
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const target = url.startsWith('http') ? url : `https://${url}`

    const res = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandBot/1.0; +https://booq.app)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(10_000),
      redirect: 'follow',
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Website returned ${res.status}` }, { status: 400 })
    }

    const html = await res.text()
    const colors = extractColors(html)

    return NextResponse.json({
      colors,
      primaryColor: colors[0] ?? null,
      accentColor:  colors[1] ?? colors[0] ?? null,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch website'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
