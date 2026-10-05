import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  IMPERSONATIE_COOKIE,
  IMPERSONATIE_MAX_AGE,
  signImpersonatie,
} from '@/lib/impersonatie'

const STARTPAGINA: Record<string, string> = {
  student: '/student',
  docent: '/docent',
  admin: '/admin',
}

// POST /api/admin/inloggen-als  { userId } → superadmin gebruikt de app als die gebruiker.
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.isDemo || session.isImpersonatie) {
    return NextResponse.json(
      { error: 'Stop eerst de huidige demo of overname' },
      { status: 409 }
    )
  }

  const { userId } = (await request.json().catch(() => ({}))) as { userId?: string }
  const doel = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null
  if (!doel) {
    return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 })
  }
  if (doel.id === session.user.id || doel.role === 'superadmin') {
    return NextResponse.json(
      { error: 'Inloggen als een (andere) superadmin is niet toegestaan' },
      { status: 403 }
    )
  }

  const hdrs = await headers()
  const log = await prisma.impersonationLog.create({
    data: {
      adminId: session.user.id,
      targetUserId: doel.id,
      actie: `Ingelogd als ${doel.role}`,
      ipAdres: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      userAgent: hdrs.get('user-agent') || null,
    },
  })

  const store = await cookies()
  store.set(
    IMPERSONATIE_COOKIE,
    await signImpersonatie({
      originalUserId: session.user.id,
      targetUserId: doel.id,
      logId: log.id,
      iat: Math.floor(Date.now() / 1000),
    }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: IMPERSONATIE_MAX_AGE,
    }
  )

  return NextResponse.json({ ok: true, redirect: STARTPAGINA[doel.role] ?? '/dashboard' })
}
