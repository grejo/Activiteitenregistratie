import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  importeerDepartmentsUitLogboek,
  leesDepartmentsUitLogboek,
} from '@/lib/opleidingSso'

// POST: serverlogs uploaden → department-codes per student aanvullen en koppelen.
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
      return NextResponse.json({ error: 'Geen logbestand geüpload' }, { status: 400 })
    }

    const teksten = await Promise.all(bestanden.map((f) => f.text()))
    const regels = leesDepartmentsUitLogboek(teksten.join('\n'))
    if (regels.length === 0) {
      return NextResponse.json(
        {
          error:
            'Geen login-regels met opleidingscode gevonden. Verwacht regels zoals "[AUTH] resolved email: … | department: …".',
        },
        { status: 400 }
      )
    }

    const toepassen = formData.get('toepassen') === 'true'
    const resultaat = await importeerDepartmentsUitLogboek(regels, { dryRun: !toepassen })
    return NextResponse.json({ ...resultaat, toegepast: toepassen })
  } catch (error) {
    console.error('Logboek-import error:', error)
    return NextResponse.json({ error: 'Het logbestand kon niet verwerkt worden' }, { status: 500 })
  }
}
