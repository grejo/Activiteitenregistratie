import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
    const { status, opmerkingen } = body

    if (!['goedgekeurd', 'afgekeurd'].includes(status)) {
      return NextResponse.json(
        { error: 'Ongeldige status' },
        { status: 400 }
      )
    }

    const updatedAanvraag = await prisma.activiteit.update({
      where: { id },
      data: {
        status,
        opmerkingen: opmerkingen || null,
      },
    })

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
