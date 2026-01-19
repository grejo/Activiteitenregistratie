import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { recalculateStudentUren } from '@/lib/recalculateStudentUren'

// Docent beoordeelt bewijsstukken
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'docent' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    const { id: inschrijvingId } = await params
    const { actie, feedback } = await request.json()

    if (!actie || !['goedkeuren', 'afkeuren'].includes(actie)) {
      return NextResponse.json(
        { error: 'Ongeldige actie. Gebruik "goedkeuren" of "afkeuren"' },
        { status: 400 }
      )
    }

    // Haal inschrijving op
    const inschrijving = await prisma.inschrijving.findUnique({
      where: { id: inschrijvingId },
      include: {
        activiteit: {
          include: {
            opleiding: true,
          },
        },
        student: {
          include: {
            opleiding: true,
          },
        },
        bewijsstukken: true,
      },
    })

    if (!inschrijving) {
      return NextResponse.json({ error: 'Inschrijving niet gevonden' }, { status: 404 })
    }

    // Controleer of bewijsstukken zijn ingediend
    if (inschrijving.bewijsStatus !== 'ingediend') {
      return NextResponse.json(
        { error: 'Er zijn geen bewijsstukken ingediend om te beoordelen' },
        { status: 400 }
      )
    }

    // Controleer of docent toegang heeft tot deze opleiding
    if (session.user.role === 'docent') {
      const docentOpleidingen = await prisma.docentOpleiding.findMany({
        where: { docentId: session.user.id },
        select: { opleidingId: true },
      })

      const opleidingIds = docentOpleidingen.map(d => d.opleidingId)
      const studentOpleidingId = inschrijving.student.opleidingId

      if (studentOpleidingId && !opleidingIds.includes(studentOpleidingId)) {
        return NextResponse.json({ error: 'Geen toegang tot deze student' }, { status: 403 })
      }
    }

    // Update de inschrijving
    const updateData: {
      bewijsStatus: string
      bewijsBeoordeeldOp: Date
      bewijsFeedback: string | null
      effectieveDeelname?: boolean
    } = {
      bewijsStatus: actie === 'goedkeuren' ? 'goedgekeurd' : 'afgekeurd',
      bewijsBeoordeeldOp: new Date(),
      bewijsFeedback: feedback || null,
    }

    // Bij goedkeuring: zet effectieveDeelname op true
    if (actie === 'goedkeuren') {
      updateData.effectieveDeelname = true
    }

    const updatedInschrijving = await prisma.inschrijving.update({
      where: { id: inschrijvingId },
      data: updateData,
      include: {
        bewijsstukken: true,
        activiteit: true,
        student: true,
      },
    })

    // Bij goedkeuring: herbereken student uren
    if (actie === 'goedkeuren') {
      await recalculateStudentUren(inschrijving.studentId)
    }

    return NextResponse.json(updatedInschrijving)
  } catch (error) {
    console.error('Error reviewing bewijsstukken:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}

// Haal details op van een inschrijving met bewijsstukken
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'docent' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    const { id: inschrijvingId } = await params

    const inschrijving = await prisma.inschrijving.findUnique({
      where: { id: inschrijvingId },
      include: {
        bewijsstukken: {
          orderBy: { uploadedAt: 'desc' },
        },
        activiteit: true,
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
    })

    if (!inschrijving) {
      return NextResponse.json({ error: 'Inschrijving niet gevonden' }, { status: 404 })
    }

    return NextResponse.json(inschrijving)
  } catch (error) {
    console.error('Error fetching inschrijving:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
