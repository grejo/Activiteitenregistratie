import { auth, getBeheerdeOpleidingIds } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import UsersTable from './UsersTable'

export const metadata = {
  title: 'Gebruikersbeheer - Admin',
}

export default async function UsersPage() {
  const session = await auth()

  if (session?.user.role !== 'admin' && session?.user.role !== 'superadmin') {
    redirect('/dashboard')
  }

  const beheerdeIds = await getBeheerdeOpleidingIds(session.user.id)

  // Opleidingsadmin ziet enkel gebruikers binnen de eigen opleiding(en):
  // studenten van die opleiding(en), docenten/admins gekoppeld aan die opleiding(en), plus zichzelf.
  const userWhere = beheerdeIds
    ? {
        OR: [
          { role: 'student', opleidingId: { in: beheerdeIds } },
          { role: 'docent', docentOpleidingen: { some: { opleidingId: { in: beheerdeIds } } } },
          { role: 'admin', adminOpleidingen: { some: { opleidingId: { in: beheerdeIds } } } },
          { id: session.user.id },
        ],
      }
    : {}

  const [users, opleidingen] = await Promise.all([
    prisma.user.findMany({
      where: userWhere,
      include: {
        opleiding: true,
        docentOpleidingen: { include: { opleiding: true } },
        adminOpleidingen: { include: { opleiding: true } },
      },
      orderBy: [{ actief: 'desc' }, { role: 'asc' }, { naam: 'asc' }],
    }),
    prisma.opleiding.findMany({
      where: beheerdeIds ? { id: { in: beheerdeIds } } : {},
      orderBy: { naam: 'asc' },
    }),
  ])

  return <UsersTable users={users} opleidingen={opleidingen} />
}
