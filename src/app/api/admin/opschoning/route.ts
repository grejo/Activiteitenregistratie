import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { verwijderBestandenVanStudent } from '@/lib/retentie'

// Studenten waarvan de bestanden opgeschoond mogen worden: niet meer actief of
// gearchiveerd (uitgeschreven/afgestudeerd) én nog bestanden die niet verwijderd zijn.
async function getOpschoonbareStudentIds(): Promise<string[]> {
  const studenten = await prisma.user.findMany({
    where: {
      role: 'student',
      OR: [{ actief: false }, { gearchiveerdOp: { not: null } }],
      inschrijvingen: {
        some: { bewijsstukken: { some: { bestandVerwijderdOp: null } } },
      },
    },
    select: { id: true },
  })
  return studenten.map((s) => s.id)
}

// Jaarlijkse studentenopschoning (bv. rond 30 september). Enkel superadmin.
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const studentId: string | undefined = body?.studentId

    // Eén specifieke student, of alle opschoonbare studenten
    const ids = studentId ? [studentId] : await getOpschoonbareStudentIds()

    let totaalBestanden = 0
    for (const id of ids) {
      totaalBestanden += await verwijderBestandenVanStudent(id)
    }

    return NextResponse.json({
      success: true,
      aantalStudenten: ids.length,
      verwijderdeBestanden: totaalBestanden,
    })
  } catch (error) {
    console.error('Error tijdens opschoning:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden tijdens de opschoning' },
      { status: 500 }
    )
  }
}
