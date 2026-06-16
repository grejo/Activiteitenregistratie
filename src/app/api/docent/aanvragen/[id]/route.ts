import { NextResponse } from 'next/server'
import { auth, getBeheerdeOpleidingIds } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Beentje } from '@prisma/client'
import { recalculateStudentVoortgang } from '@/lib/recalculateStudentVoortgang'
import { notifyPublicatie, notifyAanvraagBeoordeeld } from '@/lib/mail'

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

    // Beheerde opleidingen: superadmin = alle (null), admin/docent = gekoppelde
    const beheerdeIds = await getBeheerdeOpleidingIds(session.user.id)

    // Check if aanvraag exists and belongs to a opleiding this user manages
    const aanvraag = await prisma.activiteit.findFirst({
      where: {
        id,
        typeAanvraag: 'student',
        ...(beheerdeIds ? { opleidingId: { in: beheerdeIds } } : {}),
      },
    })

    if (!aanvraag) {
      return NextResponse.json(
        { error: 'Aanvraag niet gevonden of geen toegang' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { status, opmerkingen, beentje, niveau } = body
    // Verstuurder beslist expliciet of medestudenten een mail krijgen
    const verstuurMail = body.verstuurMail === true

    if (!['goedgekeurd', 'afgekeurd'].includes(status)) {
      return NextResponse.json(
        { error: 'Ongeldige status' },
        { status: 400 }
      )
    }

    // Bepaal finale status: open aanvragen worden gepubliceerd
    const finaleStatus =
      status === 'goedgekeurd' && aanvraag.openVoorMedestudenten
        ? 'gepubliceerd'
        : status

    // Bouw updateData op
    const updateData: Record<string, unknown> = {
      status: finaleStatus,
      opmerkingen: opmerkingen || null,
      // Mailgoedkeuring enkel zinvol bij publicatie op het prikbord
      verwittigPerMail: finaleStatus === 'gepubliceerd' ? verstuurMail : false,
    }

    if (beentje !== undefined) {
      const geldig = ['PASSIE', 'ONDERNEMEND', 'SAMENWERKING', 'MULTIDISCIPLINAIR', 'REFLECTIE']
      if (!geldig.includes(beentje)) {
        return NextResponse.json({ error: 'Ongeldig beentje' }, { status: 400 })
      }
      updateData.beentje = beentje as Beentje
    }

    if (niveau !== undefined) {
      const n = parseInt(niveau)
      if (![1, 2, 3, 4].includes(n)) {
        return NextResponse.json({ error: 'Niveau moet 1-4 zijn' }, { status: 400 })
      }
      updateData.niveau = n
    }

    const updatedAanvraag = await prisma.activiteit.update({
      where: { id },
      data: updateData,
      include: {
        inschrijvingen: { select: { studentId: true } },
        aangemaaktDoor: { select: { id: true } },  // NIEUW
      },
    })

    // Bij publicatie: maak auto-inschrijving voor indiener (idempotent via upsert)
    if (finaleStatus === 'gepubliceerd') {
      await prisma.inschrijving.upsert({
        where: {
          activiteitId_studentId: {
            activiteitId: id,
            studentId: updatedAanvraag.aangemaaktDoor.id,
          },
        },
        create: {
          activiteitId: id,
          studentId: updatedAanvraag.aangemaaktDoor.id,
          inschrijvingsstatus: 'ingeschreven',
          effectieveDeelname: true,
        },
        update: {},
      })
    }

    // De indiener krijgt altijd bericht van de uitslag (goedgekeurd/afgekeurd)
    await notifyAanvraagBeoordeeld(id)

    // Mail naar medestudenten enkel als de verstuurder dat aanvinkte (vlag bewaakt)
    if (finaleStatus === 'gepubliceerd') {
      await notifyPublicatie(id)
    }

    // Herbereken voortgang voor alle ingeschreven studenten bij goedkeuring of aanpassing beentje/niveau
    if (finaleStatus === 'goedgekeurd' || finaleStatus === 'gepubliceerd' || beentje !== undefined || niveau !== undefined) {
      for (const inschrijving of updatedAanvraag.inschrijvingen) {
        await recalculateStudentVoortgang(inschrijving.studentId)
      }
    }

    return NextResponse.json({
      success: true,
      aanvraag: {
        id: updatedAanvraag.id,
        status: updatedAanvraag.status,
      },
    })
  } catch (error) {
    console.error('Error updating aanvraag:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
