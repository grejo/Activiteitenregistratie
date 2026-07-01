import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { auth, canAccessOpleiding } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getCurrentSchooljaar } from '@/lib/utils'
import { AftekendocumentPDF } from '@/components/pdf/AftekendocumentPDF'
import type { AftekendocumentData } from '@/lib/aftekendocument.types'

// GET /api/generate-pdf?activiteitId=...&studentId=...
// Streamt een PDF-aftekendocument voor een specifieke student × activiteit.
// - Admin/superadmin: elke activiteit binnen eigen opleidingsscope.
// - Docent: activiteiten die hij zelf heeft aangemaakt.
// - Student: enkel eigen inschrijving voor de gevraagde activiteit.
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const activiteitId = url.searchParams.get('activiteitId')
  const requestedStudentId = url.searchParams.get('studentId')

  if (!activiteitId) {
    return NextResponse.json(
      { error: 'activiteitId ontbreekt' },
      { status: 400 }
    )
  }

  const activiteit = await prisma.activiteit.findUnique({
    where: { id: activiteitId },
    include: {
      opleiding: true,
      inschrijvingen: {
        include: {
          student: { include: { opleiding: true } },
        },
      },
    },
  })
  if (!activiteit) {
    return NextResponse.json({ error: 'Activiteit niet gevonden' }, { status: 404 })
  }

  // Bepaal welke student in het document komt en autoriseer.
  const role = session.user.role
  let studentInschrijving = null

  if (role === 'student') {
    studentInschrijving = activiteit.inschrijvingen.find(
      (i) => i.studentId === session.user.id
    )
    if (!studentInschrijving) {
      return NextResponse.json(
        { error: 'Je bent niet ingeschreven voor deze activiteit' },
        { status: 403 }
      )
    }
  } else if (role === 'docent') {
    if (activiteit.aangemaaktDoorId !== session.user.id) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }
    studentInschrijving = requestedStudentId
      ? activiteit.inschrijvingen.find((i) => i.studentId === requestedStudentId) ?? null
      : null
  } else if (role === 'admin' || role === 'superadmin') {
    if (
      activiteit.opleidingId &&
      !(await canAccessOpleiding(session.user.id, activiteit.opleidingId))
    ) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }
    studentInschrijving = requestedStudentId
      ? activiteit.inschrijvingen.find((i) => i.studentId === requestedStudentId) ?? null
      : null
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const student = studentInschrijving?.student ?? null
  const opleiding = student?.opleiding?.naam ?? activiteit.opleiding?.naam ?? null

  const data: AftekendocumentData = {
    student: {
      naam: student?.naam ?? '',
      studentnummer: null,
      academiejaar: getCurrentSchooljaar(),
      opleiding,
    },
    activiteit: {
      titel: activiteit.titel,
      doelstelling: activiteit.omschrijving,
      beoordelaar: null,
      datum: activiteit.datum.toLocaleDateString('nl-BE'),
      locatie: activiteit.locatie,
      organisator:
        activiteit.organisator ||
        [activiteit.organisatorPxl, activiteit.organisatorExtern]
          .filter(Boolean)
          .join(' / ') ||
        null,
      geschatteUren: null,
      verslagMaken: null,
      andereDoc: null,
    },
  }

  const pdfBuffer = await renderToBuffer(AftekendocumentPDF({ data }))
  const body = new Uint8Array(pdfBuffer)

  const safeTitel = activiteit.titel.replace(/[^a-z0-9\-_. ]/gi, '_').slice(0, 60)
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="aftekendocument-${safeTitel}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
