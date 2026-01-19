import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const inschrijvingId = formData.get('inschrijvingId') as string | null
    const activiteitId = formData.get('activiteitId') as string | null
    const type = formData.get('type') as string || 'extra_bijlage'

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand geüpload' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Ongeldig bestandstype. Toegestaan: JPG, PNG, GIF, WEBP, PDF' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Bestand is te groot. Maximum is 10MB' },
        { status: 400 }
      )
    }

    // If inschrijvingId is provided, verify ownership
    let actualInschrijvingId = inschrijvingId

    if (inschrijvingId) {
      const inschrijving = await prisma.inschrijving.findUnique({
        where: { id: inschrijvingId },
      })

      if (!inschrijving) {
        return NextResponse.json({ error: 'Inschrijving niet gevonden' }, { status: 404 })
      }

      if (inschrijving.studentId !== session.user.id && session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
      }
    } else if (activiteitId) {
      // For student aanvragen - find or create inschrijving
      const activiteit = await prisma.activiteit.findUnique({
        where: { id: activiteitId },
      })

      if (!activiteit) {
        return NextResponse.json({ error: 'Activiteit niet gevonden' }, { status: 404 })
      }

      // Verify the student owns this aanvraag
      if (activiteit.aangemaaktDoorId !== session.user.id && session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
      }

      // Find or create inschrijving for this activiteit
      let inschrijving = await prisma.inschrijving.findUnique({
        where: {
          activiteitId_studentId: {
            activiteitId,
            studentId: session.user.id,
          },
        },
      })

      if (!inschrijving) {
        inschrijving = await prisma.inschrijving.create({
          data: {
            activiteitId,
            studentId: session.user.id,
            inschrijvingsstatus: 'ingeschreven',
            effectieveDeelname: activiteit.status === 'goedgekeurd',
          },
        })
      }

      actualInschrijvingId = inschrijving.id
    } else {
      return NextResponse.json(
        { error: 'inschrijvingId of activiteitId is verplicht' },
        { status: 400 }
      )
    }

    // Create unique filename
    const fileExtension = path.extname(file.name)
    const uniqueFilename = `${uuidv4()}${fileExtension}`

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'bewijsstukken')
    await mkdir(uploadDir, { recursive: true })

    // Save file
    const filePath = path.join(uploadDir, uniqueFilename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save to database
    const bewijsstuk = await prisma.bewijsstuk.create({
      data: {
        type,
        bestandsnaam: file.name,
        bestandspad: `/uploads/bewijsstukken/${uniqueFilename}`,
        inschrijvingId: actualInschrijvingId!,
      },
    })

    return NextResponse.json(bewijsstuk, { status: 201 })
  } catch (error) {
    console.error('Error uploading bewijsstuk:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het uploaden' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const inschrijvingId = searchParams.get('inschrijvingId')
    const activiteitId = searchParams.get('activiteitId')

    let whereClause = {}

    if (inschrijvingId) {
      // Verify access to this inschrijving
      const inschrijving = await prisma.inschrijving.findUnique({
        where: { id: inschrijvingId },
        include: { activiteit: true },
      })

      if (!inschrijving) {
        return NextResponse.json({ error: 'Inschrijving niet gevonden' }, { status: 404 })
      }

      // Check if user has access
      const isOwner = inschrijving.studentId === session.user.id
      const isAdmin = session.user.role === 'admin'
      const isDocent = session.user.role === 'docent'

      if (!isOwner && !isAdmin && !isDocent) {
        return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
      }

      whereClause = { inschrijvingId }
    } else if (activiteitId) {
      const isAdmin = session.user.role === 'admin'
      const isDocent = session.user.role === 'docent'

      if (isAdmin || isDocent) {
        // Admins and docenten can see all bewijsstukken for an activiteit
        const inschrijvingen = await prisma.inschrijving.findMany({
          where: { activiteitId },
          select: { id: true },
        })

        if (inschrijvingen.length > 0) {
          whereClause = {
            inschrijvingId: {
              in: inschrijvingen.map(i => i.id)
            }
          }
        } else {
          return NextResponse.json([])
        }
      } else {
        // Students can only see their own bewijsstukken
        const inschrijving = await prisma.inschrijving.findFirst({
          where: {
            activiteitId,
            studentId: session.user.id,
          },
        })

        if (inschrijving) {
          whereClause = { inschrijvingId: inschrijving.id }
        } else {
          return NextResponse.json([])
        }
      }
    } else {
      return NextResponse.json(
        { error: 'inschrijvingId of activiteitId is verplicht' },
        { status: 400 }
      )
    }

    const bewijsstukken = await prisma.bewijsstuk.findMany({
      where: whereClause,
      orderBy: { uploadedAt: 'desc' },
    })

    return NextResponse.json(bewijsstukken)
  } catch (error) {
    console.error('Error fetching bewijsstukken:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
