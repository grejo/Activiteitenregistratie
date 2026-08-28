import { NextResponse } from 'next/server'
import { auth, isSuperadmin } from '@/lib/auth'
import { seedDemo } from '@/lib/seed-demo'

// POST /api/admin/demo/seed
// Initialiseert (of upsert) de DEMO-opleiding + demo-users + demo-activiteiten
// in de huidige database. Idempotent — kan meerdere keren gedraaid worden.
// Bedoeld voor de eerste initialisatie op prod na een fresh deploy.
// Enkel bereikbaar voor superadmin.
export async function POST() {
  const session = await auth()
  if (!session?.user || !isSuperadmin(session.user.role)) {
    return NextResponse.json({ error: 'Alleen superadmin' }, { status: 403 })
  }
  try {
    await seedDemo()
    return NextResponse.json({ ok: true, message: 'Demo-omgeving geseed.' })
  } catch (e) {
    console.error('[demo/seed] failed:', e)
    return NextResponse.json(
      { ok: false, error: (e as Error).message ?? 'Seed gefaald' },
      { status: 500 }
    )
  }
}
