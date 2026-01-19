import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin') {
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
      organisatorPxl,
      organisatorExtern,
      bewijslink,
      verplichtProfiel,
      maxPlaatsen,
      status,
      opleidingId,
    } = body

    // Validate required fields
    if (!titel || !typeActiviteit || !datum || !startuur || !einduur) {
      return NextResponse.json(
        { error: 'Titel, type, datum en tijd zijn verplicht' },
        { status: 400 }
      )
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
        organisatorPxl: organisatorPxl || null,
        organisatorExtern: organisatorExtern || null,
        bewijslink: bewijslink || null,
        verplichtProfiel: verplichtProfiel || null,
        maxPlaatsen: maxPlaatsen || null,
        status: status || existingActiviteit.status,
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

    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin') {
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
