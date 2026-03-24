import prisma from '@/lib/prisma'
import { getCurrentSchooljaar } from '@/lib/utils'
import { BEENTJES, NIVEAUS, getVeldNaam } from '@/lib/beentjes'

/**
 * Telt goedgekeurde activiteiten per beentje×niveau voor een student
 * en update de StudentVoortgang tabel.
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

  // Haal alle goedgekeurde inschrijvingen op
  const inschrijvingen = await prisma.inschrijving.findMany({
    where: {
      studentId,
      effectieveDeelname: true,
      bewijsStatus: 'goedgekeurd',
    },
    include: {
      activiteit: {
        select: { beentje: true, niveau: true, datum: true },
      },
    },
  })

  // Filter op schooljaar (activiteiten in huidig schooljaar)
  const schooljaarStart = parseInt(schooljaar.split('-')[0])
  const inSchoolJaar = inschrijvingen.filter((i) => {
    const jaar = new Date(i.activiteit.datum).getFullYear()
    const maand = new Date(i.activiteit.datum).getMonth() + 1
    // Schooljaar loopt van september tot augustus
    if (maand >= 9) return jaar === schooljaarStart
    return jaar === schooljaarStart + 1
  })

  // Tel per beentje × niveau
  const tellers: Record<string, number> = {}
  for (const beentje of BEENTJES) {
    for (const niveau of NIVEAUS) {
      tellers[getVeldNaam(beentje, niveau)] = 0
    }
  }

  for (const inschrijving of inSchoolJaar) {
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
