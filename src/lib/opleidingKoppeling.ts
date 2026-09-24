import prisma from '@/lib/prisma'
import { notifyNieuweAanvraag } from '@/lib/mail'

/**
 * Koppelt aanvragen die een student indiende terwijl zijn account nog geen
 * opleiding had (opleidingId = null) alsnog aan de opleiding van de student.
 * Zonder deze koppeling verschijnen ze nooit bij de docenten van die opleiding,
 * want de docent-overzichten filteren op activiteit.opleidingId.
 *
 * Aanvragen die nog in behandeling zijn, triggeren alsnog de melding naar de
 * beoordelaars (die bij het indienen enkel de superadmins bereikte).
 */
export async function koppelOpleidingslozeAanvragen(
  studentId: string,
  opleidingId: string
): Promise<number> {
  const wezen = await prisma.activiteit.findMany({
    where: { aangemaaktDoorId: studentId, typeAanvraag: 'student', opleidingId: null },
    select: { id: true, status: true },
  })
  if (wezen.length === 0) return 0

  await prisma.$transaction(
    wezen.flatMap((a) => [
      prisma.activiteit.update({ where: { id: a.id }, data: { opleidingId } }),
      prisma.activiteitOpleiding.upsert({
        where: { activiteitId_opleidingId: { activiteitId: a.id, opleidingId } },
        update: {},
        create: { activiteitId: a.id, opleidingId },
      }),
    ])
  )

  console.log(
    `[OPLEIDING] ${wezen.length} aanvraag/aanvragen van student ${studentId} gekoppeld aan opleiding ${opleidingId}`
  )

  for (const a of wezen) {
    if (a.status === 'in_review') await notifyNieuweAanvraag(a.id)
  }

  return wezen.length
}
