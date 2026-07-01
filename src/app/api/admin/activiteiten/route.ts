import { NextResponse } from 'next/server'
import { auth, canAccessOpleiding } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notifyPublicatie } from '@/lib/mail'

export async function POST(request: Request) {
  try {
    const session = await auth()

    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin' && session.user.role !== 'superadmin') {
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
      organisator,
      bewijslink,
      verplichtProfiel,
      maxPlaatsen,
      status,
      opleidingId,
      aftekenlijstVereist,
      verplicht,
    } = body
    const verwittigPerMail = body.verwittigPerMail === true

    // Cross-opleiding zichtbaarheid. Een lege set + lege opleidingId = departementale
    // activiteit (zichtbaar voor alle opleidingen).
    const opleidingIds: string[] = Array.from(
      new Set([
        ...(Array.isArray(body.opleidingIds) ? body.opleidingIds : []),
        ...(opleidingId ? [opleidingId] : []),
      ])
    )

    // Validate required fields
    if (!titel || !typeActiviteit || !datum || !startuur || !einduur) {
      return NextResponse.json(
        { error: 'Titel, type, datum en tijd zijn verplicht' },
        { status: 400 }
      )
    }

    // Opleidingsadmin mag enkel eigen opleiding(en) koppelen; superadmin alles
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
        organisator: organisator || null,
        bewijslink: bewijslink || null,
        verplichtProfiel: verplichtProfiel || null,
        maxPlaatsen: maxPlaatsen || null,
        status: status || 'gepubliceerd',
        typeAanvraag: 'docent', // Admin creates as docent type
        aangemaaktDoorId: session.user.id,
        opleidingId: opleidingId || null,
        aftekenlijstVereist: aftekenlijstVereist === true,
        verplicht: verplicht === true,
        verwittigPerMail,
        opleidingen: {
          create: opleidingIds.map((opId) => ({ opleidingId: opId })),
        },
      },
    })

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
