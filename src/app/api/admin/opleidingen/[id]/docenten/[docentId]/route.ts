import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; docentId: string }> }
) {
  try {
    const session = await auth()
    if (session?.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 403 })
    }

    const { id: opleidingId, docentId } = await params

    const koppeling = await prisma.docentOpleiding.findUnique({
      where: { docentId_opleidingId: { docentId, opleidingId } },
    })

    if (!koppeling) {
      return NextResponse.json({ error: 'Koppeling niet gevonden' }, { status: 404 })
    }

    await prisma.docentOpleiding.delete({
      where: { docentId_opleidingId: { docentId, opleidingId } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error verwijderen koppeling:', error)
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 })
  }
}
