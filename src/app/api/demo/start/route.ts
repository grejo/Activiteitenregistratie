import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { auth, isStaff } from '@/lib/auth'
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

// POST /api/demo/start — start een demo-sessie als demo-student of -docent.
// Alleen bereikbaar voor ingelogde staff (docent/admin/superadmin).
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Niet aangemeld' }, { status: 401 })
  }
  // Als al in demo → geen dubbele start.
  if (await readDemoCookie()) {
    return NextResponse.json({ error: 'Al in demo-modus' }, { status: 409 })
  }
  if (!isStaff(session.user.role)) {
    return NextResponse.json({ error: 'Alleen staff mag demo starten' }, { status: 403 })
  }

  let body: { role?: string } = {}
  try {
    body = await request.json()
  } catch {
    /* leeg body toegestaan */
  }
  const role: DemoRole = body.role === 'docent' ? 'docent' : 'student'

  const email = role === 'docent' ? DEMO_DOCENT_EMAIL : DEMO_STUDENT_EMAIL
  const demoUser = await prisma.user.findUnique({
    where: { email },
    include: {
      opleiding: true,
      docentOpleidingen: { include: { opleiding: true } },
    },
  })
  const koppelt =
    demoUser?.opleiding?.code === DEMO_OPLEIDING_CODE ||
    demoUser?.docentOpleidingen.some((d) => d.opleiding.code === DEMO_OPLEIDING_CODE)
  if (!demoUser || !demoUser.actief || !koppelt) {
    return NextResponse.json(
      { error: 'Demo-omgeving niet klaargezet. Draai `npm run demo:seed`.' },
      { status: 500 }
    )
  }

  const hdrs = await headers()
  const ipAdres = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const userAgent = hdrs.get('user-agent') || null

  const log = await prisma.impersonationLog.create({
    data: {
      adminId: session.user.id,
      targetUserId: demoUser.id,
      actie: `Demo gestart als ${role}`,
      ipAdres,
      userAgent,
    },
  })

  const payload = {
    originalUserId: session.user.id,
    demoUserId: demoUser.id,
    demoRole: role,
    logId: log.id,
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

  return NextResponse.json({
    ok: true,
    redirect: role === 'docent' ? '/docent' : '/student',
  })
}
