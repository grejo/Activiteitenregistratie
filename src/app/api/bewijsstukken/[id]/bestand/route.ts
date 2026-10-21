import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads')

const CONTENT_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
}

// GET /api/bewijsstukken/[id]/bestand
// Serveert het bestand zelf. Next.js serveert in productie enkel bestanden die bij
// het opstarten al in public/ stonden, dus nieuwe uploads moeten via deze route.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const bewijsstuk = await prisma.bewijsstuk.findUnique({
    where: { id },
    include: { inschrijving: true },
  })
  if (!bewijsstuk || !bewijsstuk.bestandspad) {
    return NextResponse.json({ error: 'Bewijsstuk niet gevonden' }, { status: 404 })
  }

  const isOwner = bewijsstuk.inschrijving.studentId === session.user.id
  const isAdmin = session.user.role === 'admin' || session.user.role === 'superadmin'
  const isDocent = session.user.role === 'docent'
  if (!isOwner && !isAdmin && !isDocent) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const filePath = path.resolve(path.join(process.cwd(), 'public', bewijsstuk.bestandspad))
  if (!filePath.startsWith(UPLOADS_ROOT + path.sep)) {
    return NextResponse.json({ error: 'Ongeldig pad' }, { status: 400 })
  }

  const buffer = await fs.readFile(filePath).catch(() => null)
  if (!buffer) {
    return NextResponse.json({ error: 'Bestand ontbreekt op server' }, { status: 404 })
  }

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
  const filename = (bewijsstuk.bestandsnaam || 'bewijsstuk').replace(/["\r\n]/g, '')

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
