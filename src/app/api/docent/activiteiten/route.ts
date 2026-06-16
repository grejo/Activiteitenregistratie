import { NextResponse } from 'next/server'
import { auth, canAccessOpleiding } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notifyPublicatie } from '@/lib/mail'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activiteiten = await prisma.activiteit.findMany({
      where: {
        aangemaaktDoorId: session.user.id,
      },
      include: {
        opleiding: true,
        inschrijvingen: {
          include: {
            student: true,
          },
        },
      },
      orderBy: [{ datum: 'desc' }],
    })

    return NextResponse.json(activiteiten)
  } catch (error) {
    console.error('Error fetching activiteiten:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
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
      verplichtProfiel,
      maxPlaatsen,
      status,
      opleidingId,
      niveau,
      duurzaamheidId,
    } = body
    const verwittigPerMail = body.verwittigPerMail === true

    // Volledige set opleidingen waarvoor de activiteit zichtbaar is (incl. de primaire).
    // Standaard enkel de eigen/primaire opleiding.
    const opleidingIds: string[] = Array.from(
      new Set([
        ...(Array.isArray(body.opleidingIds) ? body.opleidingIds : []),
        ...(opleidingId ? [opleidingId] : []),
      ])
    )

    // Validate required fields
    if (!titel || !typeActiviteit || !datum || !startuur || !einduur || !opleidingId) {
      return NextResponse.json(
        { error: 'Titel, type, datum, start- en einduur en opleiding zijn verplicht' },
        { status: 400 }
      )
    }

    // Controleer toegang tot élke gekozen opleiding (docent: gekoppeld; admin: eigen; superadmin: alle)
    for (const opId of opleidingIds) {
      if (!(await canAccessOpleiding(session.user.id, opId))) {
        return NextResponse.json(
          { error: 'Je hebt geen toegang tot één van de gekozen opleidingen' },
          { status: 403 }
        )
      }
    }

    // Create activiteit
    const activiteit = await prisma.activiteit.create({
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
        verplichtProfiel: verplichtProfiel || null,
        maxPlaatsen: maxPlaatsen || null,
        niveau: niveau ? parseInt(niveau) : null,
        status: status || 'gepubliceerd',
        verwittigPerMail,
        typeAanvraag: 'docent',
        aangemaaktDoorId: session.user.id,
        opleidingId: opleidingId || null,
        // Cross-opleiding zichtbaarheid
        opleidingen: {
          create: opleidingIds.map((opId) => ({ opleidingId: opId })),
        },
        // Duurzaamheid wordt apart toegevoegd
        ...(duurzaamheidId && {
          duurzaamheid: {
            create: {
              duurzaamheidId,
            },
          },
        }),
      },
    })

    // Verwittig studenten bij directe publicatie
    if (activiteit.status === 'gepubliceerd') {
      await notifyPublicatie(activiteit.id)
    }

    return NextResponse.json({
      success: true,
      activiteit: {
        id: activiteit.id,
        titel: activiteit.titel,
      },
    })
  } catch (error) {
    console.error('Error creating activiteit:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het aanmaken van de activiteit' },
      { status: 500 }
    )
  }
}
