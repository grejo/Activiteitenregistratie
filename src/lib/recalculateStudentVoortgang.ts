import prisma from '@/lib/prisma'
import { getCurrentSchooljaar } from '@/lib/utils'
import { BEENTJES, NIVEAUS, getVeldNaam } from '@/lib/beentjes'

/**
 * Telt goedgekeurde activiteiten per beentje×niveau voor een student
 * en update de StudentVoortgang tabel.
 * Activiteiten tellen over de hele opleiding heen (geen schooljaarfilter).
 * Aanroepen na elke goedkeuring van bewijsstuk of wijziging beentje/niveau.
 */
export async function recalculateStudentVoortgang(studentId: string): Promise<void> {
  const schooljaar = getCurrentSchooljaar()

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { opleidingId: true },
  })

  if (!student?.opleidingId) {
    console.log(`Student ${studentId} heeft geen opleiding, skip voortgang`)
    return
  }

  // Haal alle goedgekeurde inschrijvingen op (over de hele opleiding)
  const inschrijvingen = await prisma.inschrijving.findMany({
    where: {
      studentId,
      effectieveDeelname: true,
      bewijsStatus: 'goedgekeurd',
    },
    include: {
      activiteit: {
        select: { beentje: true, niveau: true },
      },
    },
  })

  // Tel per beentje × niveau
  const tellers: Record<string, number> = {}
  for (const beentje of BEENTJES) {
    for (const niveau of NIVEAUS) {
      tellers[getVeldNaam(beentje, niveau)] = 0
    }
  }

  for (const inschrijving of inschrijvingen) {
    const { beentje, niveau } = inschrijving.activiteit
    if (!beentje || !niveau) continue
    const veld = getVeldNaam(beentje, niveau)
    if (veld in tellers) {
      tellers[veld]++
    }
  }

  await prisma.studentVoortgang.upsert({
    where: { studentId_schooljaar: { studentId, schooljaar } },
    create: {
      studentId,
      opleidingId: student.opleidingId,
      schooljaar,
      ...tellers,
      lastCalculated: new Date(),
    },
    update: {
      ...tellers,
      lastCalculated: new Date(),
    },
  })

  console.log(`Voortgang herberekend voor student ${studentId}:`, tellers)
}
