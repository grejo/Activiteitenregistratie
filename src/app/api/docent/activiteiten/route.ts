import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
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

    if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
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

    // Validate required fields
    if (!titel || !typeActiviteit || !datum || !startuur || !einduur || !opleidingId) {
      return NextResponse.json(
        { error: 'Titel, type, datum, start- en einduur en opleiding zijn verplicht' },
        { status: 400 }
      )
    }

    // Controleer of de docent gekoppeld is aan de gekozen opleiding
    if (session.user.role === 'docent') {
      const koppeling = await prisma.docentOpleiding.findUnique({
        where: {
          docentId_opleidingId: {
            docentId: session.user.id,
            opleidingId,
          },
        },
      })

      if (!koppeling) {
        return NextResponse.json(
          { error: 'Je bent niet gekoppeld aan deze opleiding' },
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
        typeAanvraag: 'docent',
        aangemaaktDoorId: session.user.id,
        opleidingId: opleidingId || null,
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
