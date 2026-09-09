/**
 * In-process reset van de DEMO-omgeving. Gebruikt de gedeelde Prisma-singleton
 * zodat deze code mee in de Next.js-build bundelt en vanuit API-routes aanroepbaar
 * is — zonder shell-out naar ts-node of npm-scripts die op productie niet beschikbaar zijn.
 */
import prisma from '@/lib/prisma'
import { seedDemo, DEMO_CODE } from '@/lib/seed-demo'

const DEMO_ACT_IDS = [
  'seed-act-demo-passie-1',
  'seed-act-demo-samen-1',
  'seed-act-demo-multi-1',
  'seed-act-demo-onder-1',
  'seed-act-demo-reflectie-1',
  'seed-act-demo-voorbij-1',
  'seed-act-demo-aftekenlijst-1',
]

export async function resetDemo(): Promise<void> {
  const existing = await prisma.opleiding.findUnique({ where: { code: DEMO_CODE } })

  if (existing) {
    // Verwijder alle activiteiten van de DEMO-opleiding expliciet zodat cascade
    // naar Inschrijving, Bewijsstuk, ActiviteitDuurzaamheid etc. gretig meegaat.
    // (Activiteit.opleidingId heeft geen onDelete: Cascade, dus Prisma zou anders
    // SetNull toepassen en activiteiten als wezen achterlaten.)
    await prisma.activiteit.deleteMany({ where: { opleidingId: existing.id } })
    await prisma.opleiding.delete({ where: { id: existing.id } })
  }

  // Verwijder ook eventuele verweesde demo-activiteiten van een eerdere mislukte reset.
  await prisma.activiteit.deleteMany({ where: { id: { in: DEMO_ACT_IDS } } })

  await seedDemo()
}
