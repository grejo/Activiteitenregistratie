import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { verwijderBestandenVanStudent } from '@/lib/retentie'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (session?.user.role !== 'admin' && session?.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 403 })
    }

    const { id } = await params

    const student = await prisma.user.findUnique({
      where: { id },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student niet gevonden' }, { status: 404 })
    }

    if (student.gearchiveerdOp) {
      return NextResponse.json({ error: 'Student is al gearchiveerd' }, { status: 400 })
    }

    if (student.role !== 'student') {
      return NextResponse.json({ error: 'Gebruiker is geen student' }, { status: 400 })
    }

    // Retentiebeleid: verwijder de fysieke bestanden, maar behoud de metadata
    const verwijderd = await verwijderBestandenVanStudent(id)

    // Archiveer de student
    await prisma.user.update({
      where: { id },
      data: {
        actief: false,
        gearchiveerdOp: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      verwijderdeBewijsstukken: verwijderd,
    })
  } catch (error) {
    console.error('Error archiving student:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het archiveren' },
      { status: 500 }
    )
  }
}
