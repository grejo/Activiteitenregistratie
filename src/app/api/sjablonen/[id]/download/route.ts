import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { auth, canAccessOpleiding } from '@/lib/auth'
import prisma from '@/lib/prisma'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

// GET /api/sjablonen/[id]/download
// - Admin/superadmin: elk sjabloon binnen scope.
// - Docent: sjablonen van opleidingen waaraan hij gekoppeld is.
// - Student: sjablonen van zijn opleiding of van een activiteit waarvoor hij is ingeschreven / gepubliceerd voor zijn opleiding.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  const sjabloon = await prisma.sjabloon.findUnique({
    where: { id },
    include: { activiteiten: true },
  })
  if (!sjabloon || !sjabloon.bestandspad) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  }

  const role = session.user.role
  let allowed = false

  if (role === 'admin' || role === 'superadmin') {
    allowed = await canAccessOpleiding(session.user.id, sjabloon.opleidingId)
  } else if (role === 'docent') {
    const koppeling = await prisma.docentOpleiding.findFirst({
      where: { docentId: session.user.id, opleidingId: sjabloon.opleidingId },
      select: { id: true },
    })
    allowed = !!koppeling
  } else if (role === 'student') {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { opleidingId: true },
    })
    if (user?.opleidingId === sjabloon.opleidingId) allowed = true
    if (!allowed) {
      const inschrijving = await prisma.inschrijving.findFirst({
        where: {
          studentId: session.user.id,
          activiteitId: { in: sjabloon.activiteiten.map((a) => a.activiteitId) },
        },
        select: { id: true },
      })
      if (inschrijving) allowed = true
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const filePath = path.join(UPLOAD_DIR, sjabloon.bestandspad)
  const buffer = await fs.readFile(filePath).catch(() => null)
  if (!buffer) {
    return NextResponse.json({ error: 'Bestand ontbreekt op server' }, { status: 404 })
  }
  const body = new Uint8Array(buffer)
  const filename = sjabloon.bestandsnaam || 'sjabloon'

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
      'Cache-Control': 'no-store',
    },
  })
}
