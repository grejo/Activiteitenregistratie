import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (session?.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { naam, email, role, opleidingId, actief, password } = body

    // Validatie
    if (!naam || !email || !role) {
      return NextResponse.json(
        { error: 'Naam, email en rol zijn verplicht' },
        { status: 400 }
      )
    }

    // Als rol student is, is opleiding verplicht
    if (role === 'student' && !opleidingId) {
      return NextResponse.json(
        { error: 'Opleiding is verplicht voor studenten' },
        { status: 400 }
      )
    }

    // Check of gebruiker bestaat
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden' },
        { status: 404 }
      )
    }

    // Check of email al bestaat (bij andere gebruiker)
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email adres is al in gebruik' },
          { status: 400 }
        )
      }
    }

    // Bereid update data voor
    const updateData: any = {
      naam,
      email,
      role,
      actief,
      opleidingId: role === 'student' ? opleidingId : null,
    }

    // Alleen wachtwoord updaten als het is ingevuld
    if (password && password.length >= 8) {
      updateData.wachtwoord = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        opleiding: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het bijwerken van de gebruiker' },
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

    if (session?.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const { id } = await params

    // Check of gebruiker bestaat
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden' },
        { status: 404 }
      )
    }

    // Voorkom dat admin zichzelf verwijdert
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Je kunt jezelf niet verwijderen' },
        { status: 400 }
      )
    }

    // Verwijder gebruiker (cascade deletes via Prisma schema)
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Gebruiker succesvol verwijderd' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het verwijderen van de gebruiker' },
      { status: 500 }
    )
  }
}
