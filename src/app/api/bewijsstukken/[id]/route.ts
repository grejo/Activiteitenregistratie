import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { magBewijsstukkenVan } from '@/lib/bewijsstukToegang'
import { unlink } from 'fs/promises'
import path from 'path'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Find the bewijsstuk
    const bewijsstuk = await prisma.bewijsstuk.findUnique({
      where: { id },
      include: {
        inschrijving: true,
      },
    })

    if (!bewijsstuk) {
      return NextResponse.json({ error: 'Bewijsstuk niet gevonden' }, { status: 404 })
    }

    // Check permissions
    if (!(await magBewijsstukkenVan(session.user, bewijsstuk.inschrijving, { alleenAdmin: true }))) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    // Delete the file from disk
    try {
      const filePath = path.join(process.cwd(), 'public', bewijsstuk.bestandspad)
      await unlink(filePath)
    } catch (fileError) {
      console.error('Error deleting file:', fileError)
      // Continue even if file deletion fails
    }

    // Delete from database
    await prisma.bewijsstuk.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bewijsstuk:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const bewijsstuk = await prisma.bewijsstuk.findUnique({
      where: { id },
      include: {
        inschrijving: true,
      },
    })

    if (!bewijsstuk) {
      return NextResponse.json({ error: 'Bewijsstuk niet gevonden' }, { status: 404 })
    }

    // Check permissions
    if (!(await magBewijsstukkenVan(session.user, bewijsstuk.inschrijving))) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    return NextResponse.json(bewijsstuk)
  } catch (error) {
    console.error('Error fetching bewijsstuk:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
