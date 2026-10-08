import prisma from '@/lib/prisma'

/** Sjablonen (met bestand) die bij het aanmaken van een activiteit meegegeven kunnen worden. */
export async function getSjabloonOpties(opleidingIds: string[]) {
  if (opleidingIds.length === 0) return []
  return prisma.sjabloon.findMany({
    where: { opleidingId: { in: opleidingIds }, bestandspad: { not: null } },
    select: { id: true, naam: true, opleidingId: true, bestandsnaam: true },
    orderBy: { naam: 'asc' },
  })
}

/**
 * Zet de gekoppelde sjablonen van een activiteit gelijk aan `sjabloonIds`.
 * Enkel sjablonen van de opleidingen van de activiteit worden aanvaard.
 * `sjabloonIds === undefined` laat de bestaande koppelingen ongemoeid.
 */
export async function syncActiviteitSjablonen(
  activiteitId: string,
  sjabloonIds: unknown,
  opleidingIds: string[]
): Promise<void> {
  if (!Array.isArray(sjabloonIds)) return
  const gevraagd = sjabloonIds.filter((x): x is string => typeof x === 'string')
  const geldig =
    gevraagd.length > 0 && opleidingIds.length > 0
      ? await prisma.sjabloon.findMany({
          where: { id: { in: gevraagd }, opleidingId: { in: opleidingIds } },
          select: { id: true },
        })
      : []

  await prisma.$transaction([
    prisma.activiteitSjabloon.deleteMany({
      where: { activiteitId, sjabloonId: { notIn: geldig.map((s) => s.id) } },
    }),
    prisma.activiteitSjabloon.createMany({
      data: geldig.map((s) => ({ activiteitId, sjabloonId: s.id })),
      skipDuplicates: true,
    }),
  ])
}
