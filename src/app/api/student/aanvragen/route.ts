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
    const {
      titel,
      typeActiviteit,
      aard,
      omschrijving,
      datum,
      startuur,
      einduur,
      locatie,
      weblink,
      organisatorPxl,
      organisatorExtern,
      bewijslink,
    } = body

    // Validation
    if (!titel || !typeActiviteit || !datum || !startuur || !einduur) {
      return NextResponse.json(
        { error: 'Titel, type, datum, startuur en einduur zijn verplicht' },
        { status: 400 }
      )
    }

    // Get student's opleiding for auto-approval check
    const student = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { opleiding: true },
    })

    // Determine initial status based on opleiding settings
    let initialStatus = 'in_review'
    if (student?.opleiding?.autoGoedkeuringStudentActiviteiten) {
      initialStatus = 'goedgekeurd'
    }

    // Create the aanvraag (activiteit with typeAanvraag = 'student')
    const aanvraag = await prisma.activiteit.create({
      data: {
        titel,
        typeActiviteit,
        aard: aard || null,
        omschrijving: omschrijving || null,
        datum: new Date(datum),
        startuur,
        einduur,
        locatie: locatie || null,
        weblink: weblink || null,
        organisatorPxl: organisatorPxl || null,
        organisatorExtern: organisatorExtern || null,
        bewijslink: bewijslink || null,
        typeAanvraag: 'student',
        status: initialStatus,
        aangemaaktDoorId: session.user.id,
        opleidingId: student?.opleidingId || null,
      },
    })

    // If auto-approved, also create the inschrijving
    if (initialStatus === 'goedgekeurd') {
      await prisma.inschrijving.create({
        data: {
          activiteitId: aanvraag.id,
          studentId: session.user.id,
          inschrijvingsstatus: 'ingeschreven',
          effectieveDeelname: true,
        },
      })
    }

    return NextResponse.json(aanvraag, { status: 201 })
  } catch (error) {
    console.error('Error creating aanvraag:', error)
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

    const aanvragen = await prisma.activiteit.findMany({
      where: {
        aangemaaktDoorId: session.user.id,
        typeAanvraag: 'student',
      },
      include: {
        opleiding: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(aanvragen)
  } catch (error) {
    console.error('Error fetching aanvragen:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
