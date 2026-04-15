import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { unlink } from 'fs/promises'
import path from 'path'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (session?.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const { id } = await params

    const student = await prisma.user.findUnique({
      where: { id },
      include: {
        inschrijvingen: {
          include: {
            bewijsstukken: true,
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student niet gevonden' }, { status: 404 })
    }

    if (student.gearchiveerdOp) {
      return NextResponse.json({ error: 'Student is al gearchiveerd' }, { status: 400 })
    }

    // Verzamel alle bewijsstukken
    const alleBewijsstukken = student.inschrijvingen.flatMap((i) => i.bewijsstukken)

    // Verwijder bestanden van schijf
    for (const bewijs of alleBewijsstukken) {
      try {
        const filePath = path.join(process.cwd(), 'public', bewijs.bestandspad)
        await unlink(filePath)
      } catch (fileError) {
        console.error(`Bestand niet gevonden of al verwijderd: ${bewijs.bestandspad}`, fileError)
        // Doorgaan ook als bestand niet bestaat
      }
    }

    // Verwijder database-records en archiveer student in één transactie
    await prisma.$transaction([
      prisma.bewijsstuk.deleteMany({
        where: {
          inschrijving: {
            studentId: id,
          },
        },
      }),
      prisma.user.update({
        where: { id },
        data: {
          actief: false,
          gearchiveerdOp: new Date(),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      verwijderdeBewijsstukken: alleBewijsstukken.length,
    })
  } catch (error) {
    console.error('Error archiving student:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het archiveren' },
      { status: 500 }
    )
  }
}
