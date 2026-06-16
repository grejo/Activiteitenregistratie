import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const session = await auth()

    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin' && session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { naam, email, password, role, opleidingId, actief } = body
    const adminOpleidingIds: string[] = Array.isArray(body.adminOpleidingIds)
      ? body.adminOpleidingIds
      : []

    // Validate required fields
    if (!naam || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Alle velden zijn verplicht' },
        { status: 400 }
      )
    }

    // Alleen een superadmin mag de superadmin-rol toekennen
    if (role === 'superadmin' && session.user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Enkel een superadmin kan de superadmin-rol toekennen' },
        { status: 403 }
      )
    }

    // Validate student has opleidingId
    if (role === 'student' && !opleidingId) {
      return NextResponse.json(
        { error: 'Studenten moeten gekoppeld worden aan een opleiding' },
        { status: 400 }
      )
    }

    // Een opleidingsadmin moet aan minstens één opleiding gekoppeld zijn
    if (role === 'admin' && adminOpleidingIds.length === 0) {
      return NextResponse.json(
        { error: 'Een admin moet aan minstens één opleiding gekoppeld worden' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Dit email adres is al in gebruik' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        naam,
        email,
        passwordHash,
        role,
        opleidingId: role === 'student' ? opleidingId : null,
        actief: actief ?? true,
        adminOpleidingen:
          role === 'admin'
            ? { create: adminOpleidingIds.map((id) => ({ opleidingId: id })) }
            : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        naam: user.naam,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het aanmaken van de gebruiker' },
      { status: 500 }
    )
  }
}
