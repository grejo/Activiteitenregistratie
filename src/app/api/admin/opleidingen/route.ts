import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
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

    // Check if code already exists
    const existingOpleiding = await prisma.opleiding.findUnique({
      where: { code },
    })

    if (existingOpleiding) {
      return NextResponse.json(
        { error: 'Deze code is al in gebruik' },
        { status: 400 }
      )
    }

    // Create opleiding
    const opleiding = await prisma.opleiding.create({
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
    console.error('Error creating opleiding:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het aanmaken van de opleiding' },
      { status: 500 }
    )
  }
}
