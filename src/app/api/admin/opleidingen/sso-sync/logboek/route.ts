import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { auth } from '@/lib/auth'
import {
  importeerDepartmentsUitLogboek,
  leesDepartmentsUitLogboek,
  leesDepartmentsUitRijen,
  type LogboekDepartment,
} from '@/lib/opleidingSso'

const isExcel = (f: File) => /\.(xlsx|xls)$/i.test(f.name)

// POST: serverlogs en/of een Excel (E-mailadres + Afdeling) uploaden →
// department-codes per student aanvullen en koppelen.
// Zonder `toepassen=true` wordt enkel een overzicht teruggegeven.
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const bestanden = formData.getAll('files').filter((f): f is File => f instanceof File)
    if (bestanden.length === 0) {
      return NextResponse.json({ error: 'Geen bestand geüpload' }, { status: 400 })
    }

    // Excel eerst, logboek daarna: een gelogde login (met tijdstip) wint van de export
    const perEmail = new Map<string, LogboekDepartment>()
    for (const f of bestanden.filter(isExcel)) {
      const wb = XLSX.read(Buffer.from(await f.arrayBuffer()), { type: 'buffer' })
      for (const naam of wb.SheetNames) {
        const rijen = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[naam], { header: 1, defval: '' })
        for (const r of leesDepartmentsUitRijen(rijen)) perEmail.set(r.email, r)
      }
    }
    const logTekst = (await Promise.all(bestanden.filter((f) => !isExcel(f)).map((f) => f.text()))).join('\n')
    for (const r of leesDepartmentsUitLogboek(logTekst)) perEmail.set(r.email, r)

    const regels = [...perEmail.values()]
    if (regels.length === 0) {
      return NextResponse.json(
        {
          error:
            'Geen opleidingscodes gevonden. Verwacht een logboek met regels "[AUTH] resolved email: … | department: …" of een Excel met de kolommen "E-mailadres" en "Afdeling".',
        },
        { status: 400 }
      )
    }

    const toepassen = formData.get('toepassen') === 'true'
    const resultaat = await importeerDepartmentsUitLogboek(regels, { dryRun: !toepassen })
    return NextResponse.json({ ...resultaat, toegepast: toepassen })
  } catch (error) {
    console.error('Logboek-import error:', error)
    return NextResponse.json({ error: 'Het bestand kon niet verwerkt worden' }, { status: 500 })
  }
}
