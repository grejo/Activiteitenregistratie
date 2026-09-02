/**
 * Reset de DEMO-omgeving: verwijder alle demo-data en seed opnieuw.
 *
 * Gebruik: `npm run demo:reset`
 *
 * Verwijdert eerst alle demo-activiteiten expliciet zodat cascade
 * naar Inschrijving, Bewijsstuk etc. correct verloopt (Activiteit.opleidingId
 * heeft geen onDelete: Cascade, anders worden activiteiten als wezen achtergelaten).
 * Daarna wordt de opleiding gewist en opnieuw geseed via seed-demo.ts.
 */
import { PrismaClient } from '@prisma/client'
import { seedDemo } from './seed-demo'

const prisma = new PrismaClient()

const DEMO_CODE = 'DEMO'
const DEMO_ACT_IDS = [
  'seed-act-demo-passie-1',
  'seed-act-demo-samen-1',
  'seed-act-demo-multi-1',
  'seed-act-demo-onder-1',
  'seed-act-demo-reflectie-1',
  'seed-act-demo-voorbij-1',
]

export async function resetDemo(): Promise<void> {
  console.log('🎬 Reset demo-omgeving...')
  const existing = await prisma.opleiding.findUnique({ where: { code: DEMO_CODE } })
  if (existing) {
    // Verwijder activiteiten expliciet — Activiteit.opleidingId heeft geen Cascade.
    await prisma.activiteit.deleteMany({ where: { opleidingId: existing.id } })
    await prisma.opleiding.delete({ where: { id: existing.id } })
    console.log('  ✅ Oude DEMO-opleiding gewist (cascade)')
  } else {
    console.log('  ℹ️  Geen bestaande DEMO-opleiding gevonden — sla delete over.')
  }
  // Verwijder eventuele verweesde demo-activiteiten van een eerdere mislukte reset.
  await prisma.activiteit.deleteMany({ where: { id: { in: DEMO_ACT_IDS } } })
  await seedDemo()
}

if (require.main === module) {
  resetDemo()
    .catch((e) => {
      console.error('❌ Demo reset failed:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
