import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Haal alle ingediende bewijsstukken op voor docent
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'docent' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    let whereClause = {}

    // Docenten zien alleen studenten van hun opleidingen
    if (session.user.role === 'docent') {
      const docentOpleidingen = await prisma.docentOpleiding.findMany({
        where: { docentId: session.user.id },
        select: { opleidingId: true },
      })

      const opleidingIds = docentOpleidingen.map(d => d.opleidingId)

      whereClause = {
        bewijsStatus: 'ingediend',
        student: {
          opleidingId: { in: opleidingIds },
        },
      }
    } else {
      // Admin ziet alles
      whereClause = {
        bewijsStatus: 'ingediend',
      }
    }

    const inschrijvingen = await prisma.inschrijving.findMany({
      where: whereClause,
      include: {
        bewijsstukken: {
          orderBy: { uploadedAt: 'desc' },
        },
        activiteit: {
          select: {
            id: true,
            titel: true,
            typeActiviteit: true,
            datum: true,
            startuur: true,
            einduur: true,
          },
        },
        student: {
          select: {
            id: true,
            naam: true,
            email: true,
            opleiding: {
              select: { naam: true },
            },
          },
        },
      },
      orderBy: { bewijsIngediendOp: 'asc' }, // Oudste eerst
    })

    return NextResponse.json(inschrijvingen)
  } catch (error) {
    console.error('Error fetching bewijsstukken:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
