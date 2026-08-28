/**
 * Reset de DEMO-omgeving: cascade-delete van Opleiding code=DEMO
 * (verwijdert alle demo-activiteiten, inschrijvingen, bewijsstukken,
 * targets, thema's en sjablonen) en her-seed daarna via seed-demo.ts.
 *
 * De twee demo-users (demo.student@demo.local, demo.docent@demo.local)
 * blijven behouden — hun opleidingId wordt door de cascade op null gezet
 * en het seed-script hangt ze terug aan de nieuwe DEMO-opleiding.
 *
 * Gebruik: `npm run demo:reset`
 */
import { PrismaClient } from '@prisma/client'
import { seedDemo } from './seed-demo'

const prisma = new PrismaClient()

const DEMO_CODE = 'DEMO'

export async function resetDemo(): Promise<void> {
  console.log('🎬 Reset demo-omgeving...')
  const existing = await prisma.opleiding.findUnique({ where: { code: DEMO_CODE } })
  if (existing) {
    // Verwijder de bewijsstukken expliciet (cascade regelt de rest).
    const inschrijvingen = await prisma.inschrijving.findMany({
      where: { activiteit: { opleidingId: existing.id } },
      select: { id: true },
    })
    if (inschrijvingen.length) {
      await prisma.bewijsstuk.deleteMany({
        where: { inschrijvingId: { in: inschrijvingen.map((i) => i.id) } },
      })
    }
    await prisma.opleiding.delete({ where: { id: existing.id } })
    console.log('  ✅ Oude DEMO-opleiding gewist (cascade)')
  } else {
    console.log('  ℹ️  Geen bestaande DEMO-opleiding gevonden — sla delete over.')
  }
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
