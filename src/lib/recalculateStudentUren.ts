import prisma from '@/lib/prisma'
import { getCurrentSchooljaar } from '@/lib/utils'

/**
 * Berekent de duur van een activiteit in uren
 */
function calculateDuration(startuur: string, einduur: string): number {
  const [startH, startM] = startuur.split(':').map(Number)
  const [endH, endM] = einduur.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  return (endMinutes - startMinutes) / 60
}

/**
 * Herberekent alle uren voor een student en update de StudentUrenVoortgang tabel.
 * Wordt aangeroepen wanneer bewijsstukken worden goedgekeurd.
 */
export async function recalculateStudentUren(studentId: string): Promise<void> {
  const schooljaar = getCurrentSchooljaar()

  // Haal student info op
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { opleidingId: true },
  })

  if (!student?.opleidingId) {
    console.log('Student heeft geen opleiding, skip recalculation')
    return
  }

  // Haal alle goedgekeurde inschrijvingen op met effectieve deelname
  const inschrijvingen = await prisma.inschrijving.findMany({
    where: {
      studentId,
      effectieveDeelname: true,
      bewijsStatus: 'goedgekeurd',
    },
    include: {
      activiteit: {
        include: {
          duurzaamheid: true,
          evaluaties: {
            include: {
              niveau: true,
            },
          },
        },
      },
    },
  })

  // Initialiseer uren per niveau
  let urenNiveau1 = 0
  let urenNiveau2 = 0
  let urenNiveau3 = 0
  let urenNiveau4 = 0
  let urenNiveau5 = 0
  let urenDuurzaamheid = 0

  // Bereken uren per inschrijving
  for (const inschrijving of inschrijvingen) {
    const activiteit = inschrijving.activiteit
    const duration = calculateDuration(activiteit.startuur, activiteit.einduur)

    // Check duurzaamheid
    if (activiteit.duurzaamheid.length > 0) {
      urenDuurzaamheid += duration
    }

    // Bepaal niveau: eerst kijken naar direct niveau veld (student aanvragen),
    // daarna naar evaluaties (docent activiteiten)
    let niveau = activiteit.niveau || 0

    // Als geen direct niveau, check evaluaties voor niveau
    if (niveau === 0) {
      for (const evaluatie of activiteit.evaluaties) {
        if (evaluatie.niveau?.volgorde) {
          niveau = Math.max(niveau, evaluatie.niveau.volgorde)
        }
      }
    }

    // Voeg uren toe aan het juiste niveau
    switch (niveau) {
      case 1:
        urenNiveau1 += duration
        break
      case 2:
        urenNiveau2 += duration
        break
      case 3:
        urenNiveau3 += duration
        break
      case 4:
        urenNiveau4 += duration
        break
      case 5:
        urenNiveau5 += duration
        break
      default:
        // Als er geen niveau is bepaald, voeg toe aan niveau 1 (basis)
        urenNiveau1 += duration
        break
    }
  }

  // Update of maak StudentUrenVoortgang record
  await prisma.studentUrenVoortgang.upsert({
    where: {
      studentId_schooljaar: {
        studentId,
        schooljaar,
      },
    },
    create: {
      studentId,
      schooljaar,
      opleidingId: student.opleidingId,
      urenNiveau1,
      urenNiveau2,
      urenNiveau3,
      urenNiveau4,
      urenNiveau5,
      urenDuurzaamheid,
      lastCalculated: new Date(),
    },
    update: {
      urenNiveau1,
      urenNiveau2,
      urenNiveau3,
      urenNiveau4,
      urenNiveau5,
      urenDuurzaamheid,
      lastCalculated: new Date(),
    },
  })

  console.log(`Student ${studentId} uren herberekend:`, {
    urenNiveau1,
    urenNiveau2,
    urenNiveau3,
    urenNiveau4,
    urenNiveau5,
    urenDuurzaamheid,
    aantalActiviteiten: inschrijvingen.length,
  })
}
