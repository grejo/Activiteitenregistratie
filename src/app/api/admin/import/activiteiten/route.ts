import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import * as XLSX from 'xlsx'

type BeentjeEnum = 'PASSIE' | 'ONDERNEMEND' | 'SAMENWERKING' | 'MULTIDISCIPLINAIR' | 'REFLECTIE'

function parseBeentje(code: unknown): { beentje: BeentjeEnum | null; niveau: number | null } {
  if (!code || typeof code !== 'string') return { beentje: null, niveau: null }
  const lower = code.toLowerCase()
  const match = lower.match(/niveau\s+(\d+)/)
  const niveau = match ? parseInt(match[1]) : null

  let beentje: BeentjeEnum | null = null
  if (lower.includes('passie') || lower.includes('empassie')) {
    beentje = 'PASSIE'
  } else if (lower.includes('ondernemend')) {
    beentje = 'ONDERNEMEND'
  } else if (lower.includes('samen') || lower.includes('samenwerking') || lower.includes('netwerk')) {
    beentje = 'SAMENWERKING'
  } else if (lower.includes('multi') || lower.includes('disciplin')) {
    beentje = 'MULTIDISCIPLINAIR'
  } else if (lower.includes('reflectie')) {
    beentje = 'REFLECTIE'
  }

  return { beentje, niveau }
}

function parseDatumUur(cel: unknown): { datum: Date | null; uur: string | null } {
  if (!cel || typeof cel !== 'string') return { datum: null, uur: null }
  const match = cel.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}:\d{2})/)
  if (!match) return { datum: null, uur: null }
  const [, dag, maand, jaar, uur] = match
  return {
    datum: new Date(`${jaar}-${maand}-${dag}T${uur}:00`),
    uur,
  }
}

function getStudentEmail(row: Record<string, unknown>): string | null {
  const bronnen = [
    row['Deelnemer(s) activiteit'],
    row['Effectieve deelnemer(s) activiteit'],
    row['Organisator(en) activiteit'],
  ]
  for (const bron of bronnen) {
    if (bron && typeof bron === 'string') {
      const emails = bron
        .split(';')
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes('@student.pxl.be'))
      if (emails.length > 0) return emails[0]
    }
  }
  return null
}

function getDocentEmail(row: Record<string, unknown>): string | null {
  const bron = row['Aanwezige PXL-begeleider(s)']
  if (!bron || typeof bron !== 'string') return null
  const emails = bron
    .split(';')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@pxl.be'))
  return emails[0] ?? null
}

function isEffectieveDeelnemer(row: Record<string, unknown>, email: string): boolean {
  const effectief = row['Effectieve deelnemer(s) activiteit']
  if (!effectief || typeof effectief !== 'string') return false
  return effectief.toLowerCase().includes(email.toLowerCase())
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

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets['Activiteiten']
    if (!sheet) {
      return NextResponse.json({ error: 'Sheet "Activiteiten" niet gevonden' }, { status: 400 })
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

    let activiteitenAangemaakt = 0
    let activiteitenOvergeslagen = 0
    let inschrijvingenAangemaakt = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const titel = row['Titel']
        if (!titel || typeof titel !== 'string') {
          activiteitenOvergeslagen++
          continue
        }

        const { datum: beginDatum, uur: startuur } = parseDatumUur(row['Begindatum en beginuur activiteit'])
        const { uur: einduur } = parseDatumUur(row['Einddatum en einduur activiteit'])
        const { beentje, niveau } = parseBeentje(row['Code deelnemer(s)'])

        if (!beginDatum || !startuur) {
          errors.push(`Rij ${i + 2}: ongeldige begindatum voor "${titel}"`)
          activiteitenOvergeslagen++
          continue
        }

        const studentEmail = getStudentEmail(row)
        const docentEmail = getDocentEmail(row)

        // Zoek aangemaaktDoor user
        let aangemaaktDoorId: string | null = null
        if (studentEmail) {
          const student = await prisma.user.findUnique({ where: { email: studentEmail } })
          aangemaaktDoorId = student?.id ?? null
        }
        if (!aangemaaktDoorId && docentEmail) {
          const docent = await prisma.user.findUnique({ where: { email: docentEmail } })
          aangemaaktDoorId = docent?.id ?? null
        }
        if (!aangemaaktDoorId) {
          // Gebruik de admin zelf als fallback
          aangemaaktDoorId = session.user.id
        }

        const typeAanvraag = studentEmail ? 'student' : 'docent'
        const omschrijving = row['Omschrijving activiteit']
        const locatie = row['Locatie activiteit']
        const weblink = row['Weblink activiteit'] || row['URL']
        const organisatorPxl = row['Aanwezige PXL-begeleider(s)']
        const opmerkingen = row['Opmerkingen activiteit']

        const activiteit = await prisma.activiteit.create({
          data: {
            titel: titel.trim(),
            typeActiviteit: typeof row['Aard activiteit'] === 'string' ? row['Aard activiteit'].trim() : 'Onbekend',
            aard: typeof row['Aard activiteit'] === 'string' ? row['Aard activiteit'].trim() : null,
            omschrijving: typeof omschrijving === 'string' ? omschrijving.trim() : null,
            datum: beginDatum,
            startuur: startuur,
            einduur: einduur ?? startuur,
            locatie: typeof locatie === 'string' ? locatie.trim() : null,
            weblink: typeof weblink === 'string' ? weblink.trim() : null,
            organisatorPxl: typeof organisatorPxl === 'string' ? organisatorPxl.trim() : null,
            opmerkingen: typeof opmerkingen === 'string' ? opmerkingen.trim() : null,
            beentje: beentje ?? undefined,
            niveau: niveau ?? undefined,
            status: 'approved',
            typeAanvraag,
            aangemaaktDoorId,
            opleidingId: opleidingId || null,
          },
        })

        activiteitenAangemaakt++

        // Maak inschrijving aan voor student
        if (studentEmail) {
          const student = await prisma.user.findUnique({ where: { email: studentEmail } })
          if (student) {
            const effectief = isEffectieveDeelnemer(row, studentEmail)
            await prisma.inschrijving.create({
              data: {
                activiteitId: activiteit.id,
                studentId: student.id,
                inschrijvingsstatus: 'ingeschreven',
                effectieveDeelname: effectief,
                bewijsStatus: 'niet_ingediend',
              },
            })
            inschrijvingenAangemaakt++
          }
        }
      } catch (e) {
        const titel = row['Titel'] ?? `rij ${i + 2}`
        errors.push(`Rij ${i + 2} "${titel}": ${(e as Error).message}`)
        activiteitenOvergeslagen++
      }
    }

    return NextResponse.json({
      success: true,
      activiteiten: { aangemaakt: activiteitenAangemaakt, overgeslagen: activiteitenOvergeslagen },
      inschrijvingen: { aangemaakt: inschrijvingenAangemaakt },
      errors,
    })
  } catch (error) {
    console.error('Import activiteiten error:', error)
    return NextResponse.json({ error: 'Er is een fout opgetreden bij het importeren' }, { status: 500 })
  }
}
