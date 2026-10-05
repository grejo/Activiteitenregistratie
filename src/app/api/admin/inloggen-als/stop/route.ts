import { NextResponse } from 'next/server'
import { beeindigImpersonatie } from '@/lib/impersonatie'

// POST /api/admin/inloggen-als/stop → terug naar het eigen account.
// Geen rolcheck: tijdens de overname heeft de sessie de rol van de doelgebruiker.
// De gesigneerde cookie is het bewijs van de overname.
export async function POST() {
  await beeindigImpersonatie()
  return NextResponse.json({ ok: true, redirect: '/admin/users' })
}
