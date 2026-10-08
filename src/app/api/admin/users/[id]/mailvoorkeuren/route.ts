import { NextResponse } from 'next/server'
import { auth, getBeheerdeOpleidingIds, isAdmin } from '@/lib/auth'
import { getMailVoorkeuren, saveMailVoorkeuren, type MailVoorkeuren } from '@/lib/mailVoorkeuren'

// Superadmin: alle gebruikers. Opleidingsadmin: enkel gebruikers die aan minstens één
// van zijn opleidingen gekoppeld zijn, en enkel die opleidingen kan hij aanpassen.
async function bepaalScope(sessionUserId: string, voorkeuren: MailVoorkeuren) {
  const beheerd = await getBeheerdeOpleidingIds(sessionUserId)
  if (beheerd === null) return { toegang: true, toegelaten: null as string[] | null }
  const gedeeld = voorkeuren.opleidingen.some((o) => beheerd.includes(o.opleidingId))
  return { toegang: gedeeld, toegelaten: beheerd }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const voorkeuren = await getMailVoorkeuren(id)
  if (!voorkeuren) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  const { toegang } = await bepaalScope(session.user.id, voorkeuren)
  if (!toegang) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  return NextResponse.json(voorkeuren)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const voorkeuren = await getMailVoorkeuren(id)
  if (!voorkeuren) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  const { toegang, toegelaten } = await bepaalScope(session.user.id, voorkeuren)
  if (!toegang) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  await saveMailVoorkeuren(id, body, toegelaten)
  return NextResponse.json(await getMailVoorkeuren(id))
}
