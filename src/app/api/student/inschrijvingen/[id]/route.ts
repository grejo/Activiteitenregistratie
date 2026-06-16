import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'student' && session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Find the inschrijving
    const inschrijving = await prisma.inschrijving.findUnique({
      where: { id },
      include: { activiteit: true },
    })

    if (!inschrijving) {
      return NextResponse.json(
        { error: 'Inschrijving niet gevonden' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (inschrijving.studentId !== session.user.id && session.user.role !== 'admin' && session.user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Je kunt alleen je eigen inschrijvingen annuleren' },
        { status: 403 }
      )
    }

    // Uitschrijven kan tot 24 uur voor aanvang van de activiteit
    const msTotActiviteit = new Date(inschrijving.activiteit.datum).getTime() - Date.now()
    if (msTotActiviteit < 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        {
          error:
            'Uitschrijven kan tot 24 uur voor de activiteit. Neem contact op met de organisator als je je toch wilt uitschrijven.',
        },
        { status: 400 }
      )
    }

    // Update the inschrijving status
    const updated = await prisma.inschrijving.update({
      where: { id },
      data: {
        inschrijvingsstatus: 'uitgeschreven',
        uitgeschrevenOp: new Date(),
      },
    })

    // Decrement aantalIngeschreven
    await prisma.activiteit.update({
      where: { id: inschrijving.activiteitId },
      data: {
        aantalIngeschreven: { decrement: 1 },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error deleting inschrijving:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'student' && session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const inschrijving = await prisma.inschrijving.findUnique({
      where: { id },
      include: {
        activiteit: {
          include: {
            opleiding: true,
            aangemaaktDoor: {
              select: { naam: true },
            },
          },
        },
      },
    })

    if (!inschrijving) {
      return NextResponse.json(
        { error: 'Inschrijving niet gevonden' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (inschrijving.studentId !== session.user.id && session.user.role !== 'admin' && session.user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Je kunt alleen je eigen inschrijvingen bekijken' },
        { status: 403 }
      )
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
