import { NextResponse } from 'next/server'
import { auth, canAccessOpleiding } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { recalculateStudentVoortgang } from '@/lib/recalculateStudentVoortgang'

// PATCH /api/admin/activiteiten/[id]/niveau
// Admin/superadmin past het toegekende niveau van een activiteit aan en logt de wijziging
// in NiveauWijzigingLog. Elke ingeschreven student wordt herberekend.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (
    !session?.user ||
    (session.user.role !== 'admin' && session.user.role !== 'superadmin')
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const niveau = Number(body.niveau)
  const reden: string | null = body.reden ? String(body.reden).trim() : null

  if (!Number.isInteger(niveau) || niveau < 1 || niveau > 4) {
    return NextResponse.json(
      { error: 'Niveau moet 1, 2, 3 of 4 zijn' },
      { status: 400 }
    )
  }

  const activiteit = await prisma.activiteit.findUnique({
    where: { id },
    include: { inschrijvingen: { select: { studentId: true } } },
  })
  if (!activiteit) {
    return NextResponse.json({ error: 'Activiteit niet gevonden' }, { status: 404 })
  }

  // Opleidingsadmin: enkel eigen opleiding(en). Superadmin: alles.
  if (
    activiteit.opleidingId &&
    !(await canAccessOpleiding(session.user.id, activiteit.opleidingId))
  ) {
    return NextResponse.json({ error: 'Geen toegang tot deze activiteit' }, { status: 403 })
  }

  if (activiteit.niveau === niveau) {
    return NextResponse.json({ success: true, unchanged: true })
  }

  const vanNiveau = activiteit.niveau

  await prisma.$transaction([
    prisma.activiteit.update({ where: { id }, data: { niveau } }),
    prisma.niveauWijzigingLog.create({
      data: {
        activiteitId: id,
        gewijzigdDoorId: session.user.id,
        vanNiveau,
        naarNiveau: niveau,
        reden,
      },
    }),
  ])

  // Voortgang herberekenen voor elke ingeschreven student.
  const studentIds = Array.from(
    new Set(activiteit.inschrijvingen.map((i) => i.studentId))
  )
  for (const sid of studentIds) {
    await recalculateStudentVoortgang(sid)
  }

  return NextResponse.json({ success: true, vanNiveau, naarNiveau: niveau })
}
