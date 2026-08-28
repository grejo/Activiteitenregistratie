import { cookies } from 'next/headers'

// Gebruik Web Crypto (globalThis.crypto.subtle) i.p.v. Node's `crypto`
// module: deze code loopt óók in de Edge-runtime (middleware.ts roept
// auth() aan, en session() leest de demo-cookie), en Node 'crypto' is
// daar niet beschikbaar. Web Crypto werkt in beide runtimes.

export const DEMO_OPLEIDING_CODE = 'DEMO'
export const DEMO_OPLEIDING_NAAM = 'Demo Opleiding'
export const DEMO_STUDENT_EMAIL = 'demo.student@demo.local'
export const DEMO_DOCENT_EMAIL = 'demo.docent@demo.local'
export const DEMO_COOKIE = 'xfactor_demo'
export const DEMO_COOKIE_MAX_AGE = 8 * 60 * 60 // 8 uur

export type DemoRole = 'student' | 'docent'

export type DemoPayload = {
  originalUserId: string
  demoUserId: string
  demoRole: DemoRole
  logId: string
  iat: number
}

function getSecret(): string {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('AUTH_SECRET is niet gezet — demo-cookie kan niet gesigned worden')
  return s
}

function b64urlFromBytes(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function hmacSign(body: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return new Uint8Array(sig)
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export async function signDemoPayload(payload: DemoPayload): Promise<string> {
  const body = b64urlFromBytes(new TextEncoder().encode(JSON.stringify(payload)))
  const sig = b64urlFromBytes(await hmacSign(body))
  return `${body}.${sig}`
}

export async function verifyDemoCookie(
  raw: string | undefined | null
): Promise<DemoPayload | null> {
  if (!raw) return null
  const parts = raw.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = await hmacSign(body)
  const provided = b64urlToBytes(sig)
  if (!constantTimeEqual(provided, expected)) return null
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(body))) as DemoPayload
    if (
      typeof payload.originalUserId !== 'string' ||
      typeof payload.demoUserId !== 'string' ||
      typeof payload.logId !== 'string' ||
      (payload.demoRole !== 'student' && payload.demoRole !== 'docent') ||
      typeof payload.iat !== 'number'
    ) {
      return null
    }
    // Verval na DEMO_COOKIE_MAX_AGE
    if (Date.now() / 1000 - payload.iat > DEMO_COOKIE_MAX_AGE) return null
    return payload
  } catch {
    return null
  }
}

// Server-only: lees en verifieer de demo-cookie uit de huidige request.
export async function readDemoCookie(): Promise<DemoPayload | null> {
  const store = await cookies()
  return verifyDemoCookie(store.get(DEMO_COOKIE)?.value)
}

// Prisma-where fragment die de DEMO-opleiding uit een lijst filtert
// wanneer de huidige request NIET in demo-modus zit. Gebruik dit in
// admin-overzichten om te verhinderen dat de demo-opleiding tussen echte
// opleidingen verschijnt. In demo-modus geeft de helper `{}` terug zodat
// de demo-user haar eigen opleiding wel ziet.
export async function excludeDemoOpleidingWhere(): Promise<
  { code?: { not: string } } | Record<string, never>
> {
  const demo = await readDemoCookie()
  if (demo) return {}
  return { code: { not: DEMO_OPLEIDING_CODE } }
}
