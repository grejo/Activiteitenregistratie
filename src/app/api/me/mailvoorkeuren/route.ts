import { NextResponse } from 'next/server'
import { auth, isStaff } from '@/lib/auth'
import { getMailVoorkeuren, saveMailVoorkeuren } from '@/lib/mailVoorkeuren'

// GET/PUT /api/me/mailvoorkeuren — eigen mailvoorkeuren van docent/admin/superadmin
export async function GET() {
  const session = await auth()
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const voorkeuren = await getMailVoorkeuren(session.user.id)
  if (!voorkeuren) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  return NextResponse.json(voorkeuren)
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  await saveMailVoorkeuren(session.user.id, body)
  return NextResponse.json(await getMailVoorkeuren(session.user.id))
}
