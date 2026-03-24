import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Beentje } from '@prisma/client'
import { recalculateStudentVoortgang } from '@/lib/recalculateStudentVoortgang'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get docent's opleidingen
    const docentOpleidingen = await prisma.docentOpleiding.findMany({
      where: { docentId: session.user.id },
      select: { opleidingId: true },
    })
    const opleidingIds = docentOpleidingen.map((d) => d.opleidingId)

    // Check if aanvraag exists and belongs to a opleiding this docent manages
    const aanvraag = await prisma.activiteit.findFirst({
      where: {
        id,
        typeAanvraag: 'student',
        opleidingId: { in: opleidingIds },
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

    if (!['goedgekeurd', 'afgekeurd'].includes(status)) {
      return NextResponse.json(
        { error: 'Ongeldige status' },
        { status: 400 }
      )
    }

    // Bouw updateData op
    const updateData: Record<string, unknown> = {
      status,
      opmerkingen: opmerkingen || null,
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
      },
    })

    // Herbereken voortgang voor alle ingeschreven studenten bij goedkeuring of aanpassing beentje/niveau
    if (status === 'goedgekeurd' || beentje !== undefined || niveau !== undefined) {
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
