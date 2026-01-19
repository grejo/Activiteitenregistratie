import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get opleidingen the docent is linked to
    const docentOpleidingen = await prisma.docentOpleiding.findMany({
      where: { docentId: session.user.id },
      select: { opleidingId: true },
    })

    const opleidingIds = docentOpleidingen.map((d) => d.opleidingId)

    // Count pending aanvragen (student activiteiten in_review)
    const aanvragenCount = await prisma.activiteit.count({
      where: {
        typeAanvraag: 'student',
        status: 'in_review',
        ...(opleidingIds.length > 0 && { opleidingId: { in: opleidingIds } }),
      },
    })

    // Count pending bewijsstukken (ingediend status)
    const bewijsstukkenCount = await prisma.inschrijving.count({
      where: {
        bewijsStatus: 'ingediend',
        student: {
          ...(opleidingIds.length > 0 && { opleidingId: { in: opleidingIds } }),
        },
      },
    })

    return NextResponse.json({
      aanvragen: aanvragenCount,
      bewijsstukken: bewijsstukkenCount,
    })
  } catch (error) {
    console.error('Error fetching counts:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
