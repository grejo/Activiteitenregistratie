import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
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

    if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
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
      organisatorPxl,
      organisatorExtern,
      bewijslink,
      verplichtProfiel,
      maxPlaatsen,
      status,
      opleidingId,
    } = body

    const activiteit = await prisma.activiteit.update({
      where: { id },
      data: {
        titel,
        typeActiviteit,
        aard: aard || null,
        omschrijving: omschrijving || null,
        datum: datum ? new Date(datum) : undefined,
        startuur,
        einduur,
        locatie: locatie || null,
        weblink: weblink || null,
        organisatorPxl: organisatorPxl || null,
        organisatorExtern: organisatorExtern || null,
        bewijslink: bewijslink || null,
        verplichtProfiel: verplichtProfiel || null,
        maxPlaatsen: maxPlaatsen || null,
        status,
        opleidingId: opleidingId || null,
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

    if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
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
