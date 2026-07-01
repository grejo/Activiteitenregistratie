import { NextResponse } from 'next/server'
import { auth, canAccessOpleiding } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notifyPublicatie, notifyActiviteitWijziging } from '@/lib/mail'

// Bepaal welke voor studenten relevante velden gewijzigd zijn
function bepaalWijzigingen(
  oud: { datum: Date; startuur: string; einduur: string; locatie: string | null },
  nieuw: { datum?: string; startuur?: string; einduur?: string; locatie?: string | null }
): string[] {
  const w: string[] = []
  if (nieuw.datum && oud.datum.toISOString().slice(0, 10) !== nieuw.datum) w.push('datum')
  if (
    (nieuw.startuur !== undefined && nieuw.startuur !== oud.startuur) ||
    (nieuw.einduur !== undefined && nieuw.einduur !== oud.einduur)
  )
    w.push('tijdstip')
  if (nieuw.locatie !== undefined && (oud.locatie ?? '') !== (nieuw.locatie ?? '')) w.push('locatie')
  return w
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin' && session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
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

    for (const opId of opleidingIds) {
      if (!(await canAccessOpleiding(session.user.id, opId))) {
        return NextResponse.json(
          { error: 'Je hebt geen toegang tot één van de gekozen opleidingen' },
          { status: 403 }
        )
      }
    }

    // Check if activiteit exists
    const existingActiviteit = await prisma.activiteit.findUnique({
      where: { id },
    })

    if (!existingActiviteit) {
      return NextResponse.json(
        { error: 'Activiteit niet gevonden' },
        { status: 404 }
      )
    }

    // Update activiteit
    const activiteit = await prisma.activiteit.update({
      where: { id },
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
        status: status || existingActiviteit.status,
        opleidingId: opleidingId || null,
        aftekenlijstVereist: aftekenlijstVereist === true,
        verplicht: verplicht === true,
        verwittigPerMail,
        opleidingen: {
          deleteMany: {},
          create: opleidingIds.map((opId) => ({ opleidingId: opId })),
        },
      },
    })

    // Idempotent: mailt enkel als de vlag aan staat en nog niet verstuurd is.
    if (activiteit.status === 'gepubliceerd') {
      await notifyPublicatie(activiteit.id)
    }

    // Ingeschreven studenten verwittigen bij wijziging van datum/tijd/locatie
    const wijzigingen = bepaalWijzigingen(existingActiviteit, { datum, startuur, einduur, locatie })
    if (wijzigingen.length > 0) {
      await notifyActiviteitWijziging(activiteit.id, { wijzigingen })
    }

    return NextResponse.json({
      success: true,
      activiteit: {
        id: activiteit.id,
        titel: activiteit.titel,
      },
    })
  } catch (error) {
    console.error('Error updating activiteit:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het bijwerken van de activiteit' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin' && session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if activiteit exists
    const activiteit = await prisma.activiteit.findUnique({
      where: { id },
    })

    if (!activiteit) {
      return NextResponse.json(
        { error: 'Activiteit niet gevonden' },
        { status: 404 }
      )
    }

    // Ingeschreven studenten verwittigen vóór het verwijderen (inschrijvingen gaan mee weg)
    await notifyActiviteitWijziging(id, { geannuleerd: true })

    // Delete activiteit (cascade will handle related records)
    await prisma.activiteit.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Activiteit succesvol verwijderd',
    })
  } catch (error) {
    console.error('Error deleting activiteit:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het verwijderen van de activiteit' },
      { status: 500 }
    )
  }
}
