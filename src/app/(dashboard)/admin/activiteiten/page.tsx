import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import ActiviteitenTable from './ActiviteitenTable'

export const metadata = {
  title: 'Activiteiten - Admin',
}

export default async function ActiviteitenPage() {
  const session = await auth()

  if (session?.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const [activiteiten, opleidingen] = await Promise.all([
    prisma.activiteit.findMany({
      include: {
        aangemaaktDoor: { include: { opleiding: true } },
        opleiding: true,
        duurzaamheid: { include: { duurzaamheid: true } },
        inschrijvingen: { include: { student: true } },
      },
      orderBy: [{ datum: 'desc' }],
    }),
    prisma.opleiding.findMany({ orderBy: { naam: 'asc' } }),
  ])

  return <ActiviteitenTable activiteiten={activiteiten} opleidingen={opleidingen} />
}
