import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import * as XLSX from 'xlsx'

function naamVanEmail(email: string): string {
  const lokaal = email.split('@')[0]
  return lokaal
    .split('.')
    .map((deel) => deel.charAt(0).toUpperCase() + deel.slice(1))
    .join(' ')
}

function extractEmails(cel: unknown, domein: string): string[] {
  if (!cel || typeof cel !== 'string') return []
  return cel
    .split(';')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes(`@${domein}`))
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const opleidingId = formData.get('opleidingId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand geüpload' }, { status: 400 })
    }
    if (!opleidingId) {
      return NextResponse.json({ error: 'Opleiding is verplicht' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    const sheet = workbook.Sheets['Activiteiten']
    if (!sheet) {
      return NextResponse.json({ error: 'Sheet "Activiteiten" niet gevonden in het Excel-bestand' }, { status: 400 })
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

    const studentEmails = new Set<string>()
    const docentEmails = new Set<string>()

    for (const row of rows) {
      // Student emails via prioriteitslogica
      const bronnen = [
        row['Deelnemer(s) activiteit'],
        row['Effectieve deelnemer(s) activiteit'],
        row['Organisator(en) activiteit'],
      ]
      for (const bron of bronnen) {
        const emails = extractEmails(bron, 'student.pxl.be')
        emails.forEach((e) => studentEmails.add(e))
        if (emails.length > 0) break
      }

      // Docent emails
      const begeleider = row['Aanwezige PXL-begeleider(s)']
      extractEmails(begeleider, 'pxl.be').forEach((e) => docentEmails.add(e))
    }

    let studentenAangemaakt = 0
    let studentenBijgewerkt = 0
    let docentenAangemaakt = 0
    let docentenBijgewerkt = 0
    const errors: string[] = []

    for (const email of studentEmails) {
      try {
        const bestaand = await prisma.user.findUnique({ where: { email } })
        if (bestaand) {
          await prisma.user.update({
            where: { email },
            data: { naam: naamVanEmail(email), opleidingId },
          })
          studentenBijgewerkt++
        } else {
          await prisma.user.create({
            data: {
              email,
              naam: naamVanEmail(email),
              role: 'student',
              opleidingId,
              actief: true,
            },
          })
          studentenAangemaakt++
        }
      } catch (e) {
        errors.push(`Student ${email}: ${(e as Error).message}`)
      }
    }

    for (const email of docentEmails) {
      try {
        const bestaand = await prisma.user.findUnique({ where: { email } })
        if (bestaand) {
          await prisma.user.update({
            where: { email },
            data: { naam: naamVanEmail(email) },
          })
          docentenBijgewerkt++
        } else {
          await prisma.user.create({
            data: {
              email,
              naam: naamVanEmail(email),
              role: 'docent',
              actief: true,
            },
          })
          docentenAangemaakt++
        }
      } catch (e) {
        errors.push(`Docent ${email}: ${(e as Error).message}`)
      }
    }

    return NextResponse.json({
      success: true,
      studenten: { aangemaakt: studentenAangemaakt, bijgewerkt: studentenBijgewerkt, totaal: studentEmails.size },
      docenten: { aangemaakt: docentenAangemaakt, bijgewerkt: docentenBijgewerkt, totaal: docentEmails.size },
      errors,
    })
  } catch (error) {
    console.error('Import gebruikers error:', error)
    return NextResponse.json({ error: 'Er is een fout opgetreden bij het importeren' }, { status: 500 })
  }
}
