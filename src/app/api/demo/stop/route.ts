import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { DEMO_COOKIE, readDemoCookie } from '@/lib/demo'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const pExecFile = promisify(execFile)

async function runDemoReset(): Promise<void> {
  // Roep het npm-script aan zodat we exact hetzelfde reset-pad volgen
  // als een handmatige `npm run demo:reset` — geen risico op divergentie.
  const cwd = process.cwd()
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  await pExecFile(npmCmd, ['run', 'demo:reset'], {
    cwd,
    env: { ...process.env, PATH: `${cwd}${path.sep}node_modules${path.sep}.bin:${process.env.PATH ?? ''}` },
    maxBuffer: 10 * 1024 * 1024,
  })
}

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
      await runDemoReset()
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
