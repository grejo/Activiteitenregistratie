import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: opleidingId } = await params

    // Haal studenten op
    const studenten = await prisma.user.findMany({
      where: {
        role: 'student',
        opleidingId: opleidingId,
      },
      select: {
        id: true,
        naam: true,
        email: true,
        role: true,
        actief: true,
      },
      orderBy: { naam: 'asc' },
    })

    // Haal docenten op via DocentOpleiding
    const docentOpleidingen = await prisma.docentOpleiding.findMany({
      where: {
        opleidingId: opleidingId,
      },
      include: {
        docent: {
          select: {
            id: true,
            naam: true,
            email: true,
            role: true,
            actief: true,
          },
        },
      },
      orderBy: {
        docent: { naam: 'asc' },
      },
    })

    const docenten = docentOpleidingen.map((d) => d.docent)

    return NextResponse.json({
      studenten,
      docenten,
    })
  } catch (error) {
    console.error('Error fetching opleiding users:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
