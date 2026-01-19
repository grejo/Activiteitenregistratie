import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'student' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { activiteitId } = body

    if (!activiteitId) {
      return NextResponse.json(
        { error: 'Activiteit ID is verplicht' },
        { status: 400 }
      )
    }

    // Check if activiteit exists and is published
    const activiteit = await prisma.activiteit.findUnique({
      where: { id: activiteitId },
      include: {
        _count: {
          select: {
            inschrijvingen: {
              where: { inschrijvingsstatus: 'ingeschreven' },
            },
          },
        },
      },
    })

    if (!activiteit) {
      return NextResponse.json(
        { error: 'Activiteit niet gevonden' },
        { status: 404 }
      )
    }

    if (activiteit.status !== 'gepubliceerd') {
      return NextResponse.json(
        { error: 'Deze activiteit is niet beschikbaar voor inschrijving' },
        { status: 400 }
      )
    }

    // Check if activity is full
    if (
      activiteit.maxPlaatsen !== null &&
      activiteit._count.inschrijvingen >= activiteit.maxPlaatsen
    ) {
      return NextResponse.json(
        { error: 'Deze activiteit is volzet' },
        { status: 400 }
      )
    }

    // Check if already registered
    const existingInschrijving = await prisma.inschrijving.findUnique({
      where: {
        activiteitId_studentId: {
          activiteitId,
          studentId: session.user.id,
        },
      },
    })

    if (existingInschrijving) {
      if (existingInschrijving.inschrijvingsstatus === 'ingeschreven') {
        return NextResponse.json(
          { error: 'Je bent al ingeschreven voor deze activiteit' },
          { status: 400 }
        )
      }

      // Re-activate previous registration
      const updated = await prisma.inschrijving.update({
        where: { id: existingInschrijving.id },
        data: {
          inschrijvingsstatus: 'ingeschreven',
          uitgeschrevenOp: null,
          uitschrijfReden: null,
        },
      })

      return NextResponse.json(updated, { status: 200 })
    }

    // Create new registration
    const inschrijving = await prisma.inschrijving.create({
      data: {
        activiteitId,
        studentId: session.user.id,
        inschrijvingsstatus: 'ingeschreven',
      },
    })

    // Update aantalIngeschreven
    await prisma.activiteit.update({
      where: { id: activiteitId },
      data: {
        aantalIngeschreven: { increment: 1 },
      },
    })

    return NextResponse.json(inschrijving, { status: 201 })
  } catch (error) {
    console.error('Error creating inschrijving:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'student' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const inschrijvingen = await prisma.inschrijving.findMany({
      where: {
        studentId: session.user.id,
      },
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(inschrijvingen)
  } catch (error) {
    console.error('Error fetching inschrijvingen:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
