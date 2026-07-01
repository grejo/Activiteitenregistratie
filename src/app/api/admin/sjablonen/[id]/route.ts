import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { auth, canAccessOpleiding } from '@/lib/auth'
import prisma from '@/lib/prisma'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

export async function DELETE(
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
  const sjabloon = await prisma.sjabloon.findUnique({ where: { id } })
  if (!sjabloon) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  }
  if (!(await canAccessOpleiding(session.user.id, sjabloon.opleidingId))) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  if (sjabloon.bestandspad) {
    const target = path.join(UPLOAD_DIR, sjabloon.bestandspad)
    await fs.rm(target, { force: true }).catch(() => {})
  }
  await prisma.sjabloon.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
