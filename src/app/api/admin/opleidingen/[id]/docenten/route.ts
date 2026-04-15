import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (session?.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 403 })
    }

    const { id: opleidingId } = await params
    const { docentId } = await request.json()

    if (!docentId) {
      return NextResponse.json({ error: 'docentId is verplicht' }, { status: 400 })
    }

    // Valideer dat de gebruiker bestaat en een docent is
    const docent = await prisma.user.findUnique({ where: { id: docentId } })
    if (!docent || docent.role !== 'docent') {
      return NextResponse.json({ error: 'Docent niet gevonden' }, { status: 404 })
    }

    // Valideer dat de opleiding bestaat
    const opleiding = await prisma.opleiding.findUnique({ where: { id: opleidingId } })
    if (!opleiding) {
      return NextResponse.json({ error: 'Opleiding niet gevonden' }, { status: 404 })
    }

    // Maak koppeling aan (unique constraint voorkomt duplicaten)
    const koppeling = await prisma.docentOpleiding.create({
      data: { docentId, opleidingId },
      include: { docent: true },
    })

    return NextResponse.json(koppeling, { status: 201 })
  } catch (error: any) {
    // Prisma unique constraint violation
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Docent is al gekoppeld aan deze opleiding' }, { status: 409 })
    }
    console.error('Error koppeling docent:', error)
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 })
  }
}
