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

    // Check if inschrijving belongs to an activiteit of this docent
    const inschrijving = await prisma.inschrijving.findFirst({
      where: {
        id,
        activiteit: {
          aangemaaktDoorId: session.user.id,
        },
      },
    })

    if (!inschrijving) {
      return NextResponse.json(
        { error: 'Inschrijving niet gevonden of geen toegang' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { effectieveDeelname } = body

    const updatedInschrijving = await prisma.inschrijving.update({
      where: { id },
      data: {
        effectieveDeelname: effectieveDeelname ?? inschrijving.effectieveDeelname,
      },
    })

    return NextResponse.json({
      success: true,
      inschrijving: updatedInschrijving,
    })
  } catch (error) {
    console.error('Error updating inschrijving:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
