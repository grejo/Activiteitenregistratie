import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { opleidingId, deleteStudenten, deleteActiviteiten } = body

    if (!opleidingId) {
      return NextResponse.json({ error: 'Opleiding is verplicht' }, { status: 400 })
    }

    let verwijderdeStudenten = 0
    let verwijderdeActiviteiten = 0

    if (deleteActiviteiten) {
      const result = await prisma.activiteit.deleteMany({
        where: { opleidingId },
      })
      verwijderdeActiviteiten = result.count
    }

    if (deleteStudenten) {
      const result = await prisma.user.deleteMany({
        where: { role: 'student', opleidingId },
      })
      verwijderdeStudenten = result.count
    }

    return NextResponse.json({
      success: true,
      verwijderdeStudenten,
      verwijderdeActiviteiten,
    })
  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json({ error: 'Er is een fout opgetreden bij het verwijderen' }, { status: 500 })
  }
}
