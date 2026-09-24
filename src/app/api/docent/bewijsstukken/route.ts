import { NextResponse } from 'next/server'
import { auth, getBeheerdeOpleidingIds, bewijsScopeWhere } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Haal alle ingediende bewijsstukken op voor docent
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'docent' && session.user.role !== 'admin' && session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    // Docent: gekoppelde opleidingen, admin: beheerde opleidingen, superadmin: alle
    const opleidingIds = await getBeheerdeOpleidingIds(session.user.id)
    const whereClause = {
      bewijsStatus: 'ingediend',
      ...bewijsScopeWhere(session.user.id, opleidingIds),
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
            einddatum: true,
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
