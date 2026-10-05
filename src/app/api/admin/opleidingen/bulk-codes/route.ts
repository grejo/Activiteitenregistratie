import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { DEMO_OPLEIDING_CODE } from '@/lib/demo'
import { maakSdgThemas } from '@/lib/sdgs'
import {
  leesOpleidingenUitRijen,
  maakVoorstellen,
  type BulkActie,
} from '@/lib/opleidingCodesBulk'

async function isSuperadmin() {
  const session = await auth()
  return session?.user?.role === 'superadmin'
}

function laadOpleidingen() {
  return prisma.opleiding.findMany({
    where: { code: { not: DEMO_OPLEIDING_CODE } },
    select: { id: true, naam: true, code: true, codes: { select: { code: true } } },
    orderBy: { naam: 'asc' },
  })
}

// POST: Excel uploaden → voorstel per opleidingscode (er wordt nog niets gewijzigd)
export async function POST(request: Request) {
  try {
    if (!(await isSuperadmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Geen bestand geüpload' }, { status: 400 })
    }

    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rijen = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })

    let excelRijen
    try {
      excelRijen = leesOpleidingenUitRijen(rijen)
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 })
    }
    if (excelRijen.length === 0) {
      return NextResponse.json({ error: 'Geen opleidingen gevonden in het bestand' }, { status: 400 })
    }

    const opleidingen = await laadOpleidingen()
    return NextResponse.json({
      voorstellen: maakVoorstellen(excelRijen, opleidingen),
      opleidingen,
    })
  } catch (error) {
    console.error('Bulk codes preview error:', error)
    return NextResponse.json({ error: 'Het bestand kon niet verwerkt worden' }, { status: 500 })
  }
}

type ToepasRij = {
  code: string
  naam: string
  actie: BulkActie
  opleidingId?: string | null
  oudeCodeBehouden?: boolean
}

// PUT: de (eventueel aangepaste) voorstellen effectief toepassen, alles-of-niets
export async function PUT(request: Request) {
  try {
    if (!(await isSuperadmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const rijen: ToepasRij[] = (Array.isArray(body.rijen) ? body.rijen : [])
      .map((r: ToepasRij) => ({ ...r, code: String(r.code ?? '').trim(), naam: String(r.naam ?? '').trim() }))
      .filter((r: ToepasRij) => r.actie !== 'overslaan' && r.code)

    if (rijen.length === 0) {
      return NextResponse.json({ error: 'Er zijn geen wijzigingen geselecteerd' }, { status: 400 })
    }

    // Validatie vooraf
    const fouten: string[] = []
    const gezien = new Set<string>()
    const primairPer = new Map<string, string>()
    for (const r of rijen) {
      const key = r.code.toLowerCase()
      if (gezien.has(key)) fouten.push(`Code ${r.code} komt meerdere keren voor`)
      gezien.add(key)
      if (!['primair', 'extra', 'nieuw'].includes(r.actie)) fouten.push(`Ongeldige actie voor ${r.code}`)
      if ((r.actie === 'primair' || r.actie === 'extra') && !r.opleidingId) {
        fouten.push(`Kies een opleiding voor code ${r.code}`)
      }
      if (r.actie === 'nieuw' && !r.naam) fouten.push(`Naam ontbreekt voor nieuwe opleiding ${r.code}`)
      if (r.actie === 'primair' && r.opleidingId) {
        const andere = primairPer.get(r.opleidingId)
        if (andere) fouten.push(`Codes ${andere} en ${r.code} zijn allebei als primaire code van dezelfde opleiding gekozen`)
        primairPer.set(r.opleidingId, r.code)
      }
    }
    if (fouten.length > 0) {
      return NextResponse.json({ error: fouten.join('\n') }, { status: 400 })
    }

    const resultaat = await prisma.$transaction(async (tx) => {
      const log: string[] = []
      let primair = 0
      let extra = 0
      let nieuw = 0

      for (const r of rijen) {
        // Primaire code van een ándere opleiding kan niet zomaar overgenomen worden
        const eigenaar = await tx.opleiding.findFirst({
          where: { code: { equals: r.code, mode: 'insensitive' } },
          select: { id: true, naam: true },
        })
        if (eigenaar && (r.actie === 'nieuw' || eigenaar.id !== r.opleidingId)) {
          throw new Error(`Code ${r.code} is al de primaire code van "${eigenaar.naam}"`)
        }
        if (eigenaar && r.actie === 'primair') continue // al correct

        // Een code mag maar bij één opleiding staan: haal bestaande extra-mapping weg
        await tx.opleidingCode.deleteMany({
          where: { code: { equals: r.code, mode: 'insensitive' } },
        })

        if (r.actie === 'nieuw') {
          const o = await tx.opleiding.create({ data: { naam: r.naam, code: r.code } })
          await maakSdgThemas(tx, o.id)
          log.push(`Nieuwe opleiding "${r.naam}" aangemaakt met code ${r.code}`)
          nieuw++
          continue
        }

        const opleiding = await tx.opleiding.findUnique({
          where: { id: r.opleidingId! },
          select: { id: true, naam: true, code: true },
        })
        if (!opleiding) throw new Error(`Opleiding voor code ${r.code} niet gevonden`)

        if (r.actie === 'extra') {
          if (opleiding.code.toLowerCase() !== r.code.toLowerCase()) {
            await tx.opleidingCode.create({
              data: { code: r.code, omschrijving: r.naam || null, opleidingId: opleiding.id },
            })
          }
          log.push(`${r.code} toegevoegd als extra code bij "${opleiding.naam}"`)
          extra++
          continue
        }

        // primair
        await tx.opleiding.update({ where: { id: opleiding.id }, data: { code: r.code } })
        const oud = opleiding.code
        if (r.oudeCodeBehouden !== false && oud.toLowerCase() !== r.code.toLowerCase()) {
          const oudBezet = await tx.opleidingCode.findFirst({
            where: { code: { equals: oud, mode: 'insensitive' } },
          })
          if (!oudBezet) {
            await tx.opleidingCode.create({
              data: { code: oud, omschrijving: 'Vorige primaire code', opleidingId: opleiding.id },
            })
          }
        }
        log.push(`"${opleiding.naam}": code ${oud} → ${r.code}`)
        primair++
      }

      return { primair, extra, nieuw, log }
    }, { timeout: 60_000 })

    return NextResponse.json({ success: true, ...resultaat })
  } catch (error) {
    console.error('Bulk codes apply error:', error)
    const msg = error instanceof Error && error.message ? error.message : 'Er is een fout opgetreden'
    return NextResponse.json({ error: `Niets gewijzigd: ${msg}` }, { status: 400 })
  }
}
