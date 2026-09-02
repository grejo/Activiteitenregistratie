import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { DEMO_COOKIE, readDemoCookie } from '@/lib/demo'
import { resetDemo } from '@/lib/reset-demo'

// POST /api/demo/stop
// Body: { reset?: boolean } — als reset=true wordt de DEMO-opleiding
// gewist en opnieuw geseed voordat de sessie eindigt.
export async function POST(request: Request) {
  const current = await readDemoCookie()
  if (!current) {
    return NextResponse.json({ ok: true, alreadyStopped: true })
  }

  let body: { reset?: boolean } = {}
  try {
    body = await request.json()
  } catch {
    /* empty body allowed */
  }
  const shouldReset = body.reset === true

  await prisma.impersonationLog
    .update({
      where: { id: current.logId },
      data: { endedAt: new Date() },
    })
    .catch(() => {
      /* log kan verwijderd zijn na een reset — negeer */
    })

  const store = await cookies()
  store.delete(DEMO_COOKIE)

  if (shouldReset) {
    try {
      await resetDemo()
    } catch (e) {
      console.error('[demo/stop] reset gefaald:', e)
      return NextResponse.json(
        { ok: false, error: 'Reset gefaald — cookie werd wel gewist.' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ ok: true, redirect: '/dashboard' })
}
