import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { recalculateStudentVoortgang } from '@/lib/recalculateStudentVoortgang'

export async function POST() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 403 })
  }

  const studenten = await prisma.user.findMany({
    where: { role: 'student' },
    select: { id: true },
  })

  let verwerkt = 0
  const errors: string[] = []

  for (const student of studenten) {
    try {
      await recalculateStudentVoortgang(student.id)
      verwerkt++
    } catch (e) {
      errors.push(`Student ${student.id}: ${e instanceof Error ? e.message : 'onbekende fout'}`)
    }
  }

  return NextResponse.json({ verwerkt, totaal: studenten.length, errors })
}
