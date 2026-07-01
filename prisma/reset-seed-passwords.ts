/**
 * Reset ALLEEN de wachtwoorden van de bekende seed-accounts naar hun
 * standaardwaardes. Raakt geen andere users, opleidingen, activiteiten
 * of koppelingen aan. Veilig om tegen productie te draaien.
 *
 * Gebruik:
 *   DATABASE_URL="postgresql://..." npm run reset-passwords
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

type SeedAccount = { email: string; wachtwoord: string; rol: 'superadmin' | 'admin' | 'docent' | 'student' }

const ACCOUNTS: SeedAccount[] = [
  { email: 'admin@pxl.be', wachtwoord: 'admin123', rol: 'superadmin' },
  { email: 'admin.bouw@pxl.be', wachtwoord: 'admin123', rol: 'admin' },
  { email: 'docent.bouw@pxl.be', wachtwoord: 'docent123', rol: 'docent' },
  { email: 'docent.multi@pxl.be', wachtwoord: 'docent123', rol: 'docent' },
  { email: 'student.bouw@student.pxl.be', wachtwoord: 'student123', rol: 'student' },
  { email: 'student.it@student.pxl.be', wachtwoord: 'student123', rol: 'student' },
  { email: 'emma.janssen@student.pxl.be', wachtwoord: 'student123', rol: 'student' },
  { email: 'lucas.peeters@student.pxl.be', wachtwoord: 'student123', rol: 'student' },
  { email: 'sophie.claes@student.pxl.be', wachtwoord: 'student123', rol: 'student' },
  { email: 'noah.willems@student.pxl.be', wachtwoord: 'student123', rol: 'student' },
]

async function main() {
  console.log('🔐 Reset seed-wachtwoorden...')
  let gereset = 0
  let overgeslagen = 0

  for (const acc of ACCOUNTS) {
    const bestaand = await prisma.user.findUnique({ where: { email: acc.email } })
    if (!bestaand) {
      console.log(`  ⚠️  ${acc.email} bestaat niet — overgeslagen`)
      overgeslagen++
      continue
    }
    const hash = await bcrypt.hash(acc.wachtwoord, 10)
    await prisma.user.update({
      where: { email: acc.email },
      data: { passwordHash: hash, role: acc.rol, actief: true },
    })
    console.log(`  ✅ ${acc.email} (${acc.rol}) → wachtwoord gereset`)
    gereset++
  }

  console.log(`\nKlaar. ${gereset} gereset, ${overgeslagen} overgeslagen.`)
}

main()
  .catch((e) => {
    console.error('❌ Fout:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
