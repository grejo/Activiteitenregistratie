import { auth, getBeheerdeOpleidingIds } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import ActiviteitenTable from './ActiviteitenTable'

export const metadata = {
  title: 'Activiteiten - Admin',
}

export default async function ActiviteitenPage() {
  const session = await auth()

  if (session?.user.role !== 'admin' && session?.user.role !== 'superadmin') {
    redirect('/dashboard')
  }

  const beheerdeIds = await getBeheerdeOpleidingIds(session.user.id)

  const [activiteiten, opleidingen] = await Promise.all([
    prisma.activiteit.findMany({
      where: beheerdeIds ? { opleidingId: { in: beheerdeIds } } : {},
      include: {
        aangemaaktDoor: { include: { opleiding: true } },
        opleiding: true,
        duurzaamheid: { include: { duurzaamheid: true } },
        inschrijvingen: { include: { student: true } },
      },
      orderBy: [{ datum: 'asc' }],
    }),
    prisma.opleiding.findMany({
      where: beheerdeIds ? { id: { in: beheerdeIds } } : {},
      orderBy: { naam: 'asc' },
    }),
  ])

  return <ActiviteitenTable activiteiten={activiteiten} opleidingen={opleidingen} />
}
