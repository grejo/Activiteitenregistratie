import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import {
  DEMO_COOKIE,
  DEMO_COOKIE_MAX_AGE,
  DEMO_OPLEIDING_CODE,
  DEMO_STUDENT_EMAIL,
  DEMO_DOCENT_EMAIL,
  signDemoPayload,
  readDemoCookie,
  type DemoRole,
} from '@/lib/demo'
import { seedDemo } from '@/lib/seed-demo'

// POST /api/demo/switch — wissel binnen een lopende demo tussen student en docent.
export async function POST(request: Request) {
  const current = await readDemoCookie()
  if (!current) {
    return NextResponse.json({ error: 'Niet in demo-modus' }, { status: 401 })
  }

  let body: { role?: string } = {}
  try {
    body = await request.json()
  } catch {
    /* leeg body toegestaan */
  }
  const role: DemoRole = body.role === 'docent' ? 'docent' : 'student'
  if (role === current.demoRole) {
    return NextResponse.json({ ok: true, redirect: role === 'docent' ? '/docent' : '/student' })
  }

  async function findDemoUser(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        opleiding: true,
        docentOpleidingen: { include: { opleiding: true } },
      },
    })
  }

  function isGekoppeld(user: Awaited<ReturnType<typeof findDemoUser>>) {
    return (
      user?.opleiding?.code === DEMO_OPLEIDING_CODE ||
      user?.docentOpleidingen.some((d) => d.opleiding.code === DEMO_OPLEIDING_CODE)
    )
  }

  const email = role === 'docent' ? DEMO_DOCENT_EMAIL : DEMO_STUDENT_EMAIL
  let demoUser = await findDemoUser(email)

  if (!demoUser || !demoUser.actief || !isGekoppeld(demoUser)) {
    try {
      await seedDemo()
    } catch (e) {
      console.error('[demo/switch] auto-seed gefaald:', e)
      return NextResponse.json(
        { error: 'Demo-omgeving kon niet worden klaargezet. Probeer opnieuw of contacteer de beheerder.' },
        { status: 500 }
      )
    }
    demoUser = await findDemoUser(email)
    if (!demoUser || !demoUser.actief || !isGekoppeld(demoUser)) {
      return NextResponse.json(
        { error: 'Demo-omgeving kon niet worden klaargezet. Probeer opnieuw of contacteer de beheerder.' },
        { status: 500 }
      )
    }
  }

  // Log de switch op de bestaande ImpersonationLog-entry.
  const existing = await prisma.impersonationLog.findUnique({ where: { id: current.logId } })
  if (existing) {
    const prev = existing.details ?? ''
    const line = `switch → ${role} (${new Date().toISOString()})`
    await prisma.impersonationLog.update({
      where: { id: current.logId },
      data: { details: prev ? `${prev} | ${line}` : line },
    })
  }

  const payload = {
    ...current,
    demoUserId: demoUser.id,
    demoRole: role,
    iat: Math.floor(Date.now() / 1000),
  }
  const store = await cookies()
  store.set(DEMO_COOKIE, await signDemoPayload(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DEMO_COOKIE_MAX_AGE,
  })
  return NextResponse.json({ ok: true, redirect: role === 'docent' ? '/docent' : '/student' })
}
