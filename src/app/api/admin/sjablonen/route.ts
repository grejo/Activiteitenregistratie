import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { auth, canAccessOpleiding } from '@/lib/auth'
import prisma from '@/lib/prisma'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
const SJABLOON_SUBDIR = 'sjablonen'

export async function GET() {
  const session = await auth()
  if (
    !session?.user ||
    (session.user.role !== 'admin' && session.user.role !== 'superadmin')
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const sjablonen = await prisma.sjabloon.findMany({
    include: { opleiding: true },
    orderBy: [{ opleiding: { naam: 'asc' } }, { naam: 'asc' }],
  })
  return NextResponse.json(sjablonen)
}

export async function POST(request: Request) {
  const session = await auth()
  if (
    !session?.user ||
    (session.user.role !== 'admin' && session.user.role !== 'superadmin')
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await request.formData()
  const naam = String(form.get('naam') || '').trim()
  const beschrijving = form.get('beschrijving')
    ? String(form.get('beschrijving')).trim()
    : null
  const opleidingId = String(form.get('opleidingId') || '')
  const file = form.get('bestand') as File | null

  if (!naam || !opleidingId) {
    return NextResponse.json(
      { error: 'Naam en opleiding zijn verplicht' },
      { status: 400 }
    )
  }
  if (!(await canAccessOpleiding(session.user.id, opleidingId))) {
    return NextResponse.json({ error: 'Geen toegang tot opleiding' }, { status: 403 })
  }

  let bestandspad: string | null = null
  let bestandsnaam: string | null = null
  if (file && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Bestand mag maximaal 10 MB zijn' },
        { status: 400 }
      )
    }
    const dir = path.join(UPLOAD_DIR, SJABLOON_SUBDIR)
    await fs.mkdir(dir, { recursive: true })
    const ext = path.extname(file.name)
    const stored = `${randomUUID()}${ext}`
    const target = path.join(dir, stored)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(target, buffer)
    bestandspad = path.join(SJABLOON_SUBDIR, stored)
    bestandsnaam = file.name
  }

  const sjabloon = await prisma.sjabloon.create({
    data: { naam, beschrijving, opleidingId, bestandspad, bestandsnaam },
  })
  return NextResponse.json({ success: true, sjabloon })
}
