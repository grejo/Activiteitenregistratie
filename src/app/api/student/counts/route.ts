import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studentId = session.user.id

    // Tel afgekeurde aanvragen die nog niet bekeken zijn
    // (status = 'afgekeurd' en afgekeurdBekekenOp is null)
    const aanvragenCount = await prisma.activiteit.count({
      where: {
        aangemaaktDoorId: studentId,
        typeAanvraag: 'student',
        status: 'afgekeurd',
        afgekeurdBekekenOp: null,
      },
    })

    // Tel inschrijvingen waar:
    // 1. bewijsStatus = 'niet_ingediend' (bewijs moet nog ingediend worden)
    // 2. OF bewijsStatus = 'afgekeurd' en afgekeurdBekekenOp is null (afgekeurd en niet bekeken)
    const bewijsstukkenCount = await prisma.inschrijving.count({
      where: {
        studentId,
        OR: [
          {
            // Bewijs moet nog ingediend worden (activiteit is in het verleden)
            bewijsStatus: 'niet_ingediend',
            activiteit: {
              datum: { lt: new Date() },
              status: { in: ['gepubliceerd', 'goedgekeurd', 'afgerond'] },
            },
          },
          {
            // Bewijs is afgekeurd en nog niet bekeken
            bewijsStatus: 'afgekeurd',
            bewijsAfgekeurdBekekenOp: null,
          },
        ],
      },
    })

    return NextResponse.json({
      aanvragen: aanvragenCount,
      bewijsstukken: bewijsstukkenCount,
    })
  } catch (error) {
    console.error('Error fetching student counts:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
