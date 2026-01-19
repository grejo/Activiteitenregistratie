import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { naam, code, beschrijving, actief, autoGoedkeuringStudentActiviteiten } = body

    // Validate required fields
    if (!naam || !code) {
      return NextResponse.json(
        { error: 'Naam en code zijn verplicht' },
        { status: 400 }
      )
    }

    // Check if opleiding exists
    const existingOpleiding = await prisma.opleiding.findUnique({
      where: { id: params.id },
    })

    if (!existingOpleiding) {
      return NextResponse.json(
        { error: 'Opleiding niet gevonden' },
        { status: 404 }
      )
    }

    // Check if code is already in use by another opleiding
    if (code !== existingOpleiding.code) {
      const codeInUse = await prisma.opleiding.findFirst({
        where: {
          code,
          id: { not: params.id },
        },
      })

      if (codeInUse) {
        return NextResponse.json(
          { error: 'Deze code is al in gebruik' },
          { status: 400 }
        )
      }
    }

    // Update opleiding
    const opleiding = await prisma.opleiding.update({
      where: { id: params.id },
      data: {
        naam,
        code,
        beschrijving: beschrijving || null,
        actief: actief ?? true,
        autoGoedkeuringStudentActiviteiten: autoGoedkeuringStudentActiviteiten ?? false,
      },
    })

    return NextResponse.json({
      success: true,
      opleiding: {
        id: opleiding.id,
        naam: opleiding.naam,
        code: opleiding.code,
      },
    })
  } catch (error) {
    console.error('Error updating opleiding:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het bijwerken van de opleiding' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if opleiding exists
    const opleiding = await prisma.opleiding.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            studenten: true,
            docenten: true,
            activiteiten: true,
          },
        },
      },
    })

    if (!opleiding) {
      return NextResponse.json(
        { error: 'Opleiding niet gevonden' },
        { status: 404 }
      )
    }

    // Check if opleiding has dependencies
    if (
      opleiding._count.studenten > 0 ||
      opleiding._count.docenten > 0 ||
      opleiding._count.activiteiten > 0
    ) {
      return NextResponse.json(
        {
          error:
            'Deze opleiding kan niet worden verwijderd omdat er nog studenten, docenten of activiteiten aan gekoppeld zijn',
        },
        { status: 400 }
      )
    }

    // Delete opleiding
    await prisma.opleiding.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Opleiding succesvol verwijderd',
    })
  } catch (error) {
    console.error('Error deleting opleiding:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het verwijderen van de opleiding' },
      { status: 500 }
    )
  }
}
