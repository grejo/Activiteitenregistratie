import { NextResponse } from 'next/server'
import { auth, canAccessOpleiding } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notifyPublicatie, notifyActiviteitWijziging } from '@/lib/mail'
import { recalculateStudentVoortgang } from '@/lib/recalculateStudentVoortgang'
import { parsePeriodeEnUren } from '@/lib/utils'

// Bepaal welke voor studenten relevante velden gewijzigd zijn
function bepaalWijzigingen(
  oud: { datum: Date; einddatum: Date | null; startuur: string; einduur: string; locatie: string | null },
  nieuw: { datum?: string; einddatum?: Date | null; startuur?: string; einduur?: string; locatie?: string | null }
): string[] {
  const w: string[] = []
  if (nieuw.datum && oud.datum.toISOString().slice(0, 10) !== nieuw.datum) w.push('datum')
  if ((oud.einddatum?.getTime() ?? null) !== (nieuw.einddatum?.getTime() ?? null)) w.push('datum')
  if (
    (nieuw.startuur !== undefined && nieuw.startuur !== oud.startuur) ||
    (nieuw.einduur !== undefined && nieuw.einduur !== oud.einduur)
  )
    w.push('tijdstip')
  if (nieuw.locatie !== undefined && (oud.locatie ?? '') !== (nieuw.locatie ?? '')) w.push('locatie')
  return Array.from(new Set(w))
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const activiteit = await prisma.activiteit.findFirst({
      where: {
        id,
        aangemaaktDoorId: session.user.id,
      },
      include: {
        opleiding: true,
        opleidingen: { select: { opleidingId: true } },
        inschrijvingen: {
          include: {
            student: true,
          },
        },
        duurzaamheid: {
          include: {
            duurzaamheid: true,
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

    return NextResponse.json(activiteit)
  } catch (error) {
    console.error('Error fetching activiteit:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if activiteit belongs to this docent
    const existingActiviteit = await prisma.activiteit.findFirst({
      where: {
        id,
        aangemaaktDoorId: session.user.id,
      },
    })

    if (!existingActiviteit) {
      return NextResponse.json(
        { error: 'Activiteit niet gevonden of geen toegang' },
        { status: 404 }
      )
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
      niveau,
      aftekenlijstVereist,
      verplicht,
    } = body
    const verwittigPerMail = body.verwittigPerMail === true

    // Volledige set opleidingen (incl. primaire). Indien niet meegegeven: behoud bestaand gedrag (enkel primaire).
    const opleidingIds: string[] = Array.from(
      new Set([
        ...(Array.isArray(body.opleidingIds) ? body.opleidingIds : []),
        ...(opleidingId ? [opleidingId] : []),
      ])
    )

    // Toegang tot élke gekozen opleiding controleren
    for (const opId of opleidingIds) {
      if (!(await canAccessOpleiding(session.user.id, opId))) {
        return NextResponse.json(
          { error: 'Je hebt geen toegang tot één van de gekozen opleidingen' },
          { status: 403 }
        )
      }
    }

    const nieuwNiveau = niveau ? parseInt(niveau) : null
    const niveauGewijzigd = nieuwNiveau !== existingActiviteit.niveau

    let periodeEnUren
    try {
      periodeEnUren = parsePeriodeEnUren(body, datum ?? existingActiviteit.datum)
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Ongeldige periode' },
        { status: 400 }
      )
    }

    const activiteit = await prisma.activiteit.update({
      where: { id },
      data: {
        titel,
        typeActiviteit,
        aard: aard || null,
        omschrijving: omschrijving || null,
        datum: datum ? new Date(datum) : undefined,
        einddatum: periodeEnUren.einddatum,
        startuur,
        einduur,
        aantalUren: periodeEnUren.aantalUren,
        locatie: locatie || null,
        weblink: weblink || null,
        organisator: organisator || null,
        bewijslink: bewijslink || null,
        verplichtProfiel: verplichtProfiel || null,
        maxPlaatsen: maxPlaatsen || null,
        status,
        opleidingId: opleidingId || null,
        niveau: nieuwNiveau,
        aftekenlijstVereist: aftekenlijstVereist === true,
        verplicht: verplicht === true,
        verwittigPerMail,
        opleidingen: {
          deleteMany: {},
          create: opleidingIds.map((opId) => ({ opleidingId: opId })),
        },
      },
    })

    // Niveauwijziging loggen (consistent met de admin-flow) en de voortgang van
    // elke ingeschreven student herberekenen. Loggen kan enkel naar een concreet
    // niveau: NiveauWijzigingLog.naarNiveau is verplicht.
    if (niveauGewijzigd) {
      if (nieuwNiveau !== null) {
        await prisma.niveauWijzigingLog.create({
          data: {
            activiteitId: id,
            gewijzigdDoorId: session.user.id,
            vanNiveau: existingActiviteit.niveau,
            naarNiveau: nieuwNiveau,
            reden: null,
          },
        })
      }
      const inschrijvingen = await prisma.inschrijving.findMany({
        where: { activiteitId: id },
        select: { studentId: true },
      })
      const studentIds = Array.from(new Set(inschrijvingen.map((i) => i.studentId)))
      for (const sid of studentIds) {
        await recalculateStudentVoortgang(sid)
      }
    }

    // notifyPublicatie is idempotent en bewaakt zelf de vlag + reeds-verstuurd;
    // zo vertrekt de mail ook als de docent 'verwittigen' pas later aanvinkt.
    if (activiteit.status === 'gepubliceerd') {
      await notifyPublicatie(activiteit.id)
    }

    // Ingeschreven studenten verwittigen bij wijziging van datum/tijd/locatie
    const wijzigingen = bepaalWijzigingen(existingActiviteit, {
      datum,
      einddatum: periodeEnUren.einddatum,
      startuur,
      einduur,
      locatie,
    })
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

    if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if activiteit belongs to this docent
    const existingActiviteit = await prisma.activiteit.findFirst({
      where: {
        id,
        aangemaaktDoorId: session.user.id,
      },
    })

    if (!existingActiviteit) {
      return NextResponse.json(
        { error: 'Activiteit niet gevonden of geen toegang' },
        { status: 404 }
      )
    }

    // Ingeschreven studenten verwittigen vóór het verwijderen (inschrijvingen gaan mee weg)
    await notifyActiviteitWijziging(id, { geannuleerd: true })

    await prisma.activiteit.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting activiteit:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het verwijderen van de activiteit' },
      { status: 500 }
    )
  }
}
