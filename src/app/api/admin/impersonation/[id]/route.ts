import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PATCH /api/admin/impersonation/[id]  → sluit een openstaande impersonation-sessie af.
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (
    !session?.user ||
    (session.user.role !== 'admin' && session.user.role !== 'superadmin')
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const log = await prisma.impersonationLog.findUnique({ where: { id } })
  if (!log || log.adminId !== session.user.id) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  }
  if (log.endedAt) {
    return NextResponse.json({ success: true, alreadyEnded: true })
  }

  await prisma.impersonationLog.update({
    where: { id },
    data: { endedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
