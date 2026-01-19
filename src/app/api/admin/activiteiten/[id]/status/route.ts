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
    const { status, opmerkingen } = body

    // Validate status
    const validStatuses = ['concept', 'gepubliceerd', 'in_review', 'goedgekeurd', 'afgekeurd', 'afgerond']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Ongeldige status' },
        { status: 400 }
      )
    }

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

    // Update activiteit status
    const updatedActiviteit = await prisma.activiteit.update({
      where: { id },
      data: {
        status,
        opmerkingen: opmerkingen || activiteit.opmerkingen,
      },
    })

    return NextResponse.json({
      success: true,
      activiteit: {
        id: updatedActiviteit.id,
        titel: updatedActiviteit.titel,
        status: updatedActiviteit.status,
      },
    })
  } catch (error) {
    console.error('Error updating activiteit status:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het wijzigen van de status' },
      { status: 500 }
    )
  }
}
