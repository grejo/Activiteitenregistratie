import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { synchroniseerStudentOpleidingen } from '@/lib/opleidingSso'

async function isSuperadmin() {
  const session = await auth()
  return session?.user?.role === 'superadmin'
}

// GET: overzicht van wat een synchronisatie zou wijzigen (er wordt niets aangepast)
export async function GET() {
  if (!(await isSuperadmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json(await synchroniseerStudentOpleidingen({ dryRun: true }))
}

// POST: koppel alle studenten aan de opleiding die bij hun SSO-department hoort
export async function POST() {
  try {
    if (!(await isSuperadmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(await synchroniseerStudentOpleidingen())
  } catch (error) {
    console.error('SSO-sync error:', error)
    return NextResponse.json({ error: 'Er is een fout opgetreden bij het koppelen' }, { status: 500 })
  }
}
