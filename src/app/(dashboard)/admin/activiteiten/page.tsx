import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import ActiviteitenTable from './ActiviteitenTable'

export const metadata = {
  title: 'Activiteiten - Admin',
}

async function getActiviteiten() {
  return await prisma.activiteit.findMany({
    include: {
      aangemaaktDoor: {
        include: {
          opleiding: true,
        },
      },
      opleiding: true,
      duurzaamheid: {
        include: {
          duurzaamheid: true,
        },
      },
      evaluaties: true,
      inschrijvingen: {
        include: {
          student: true,
        },
      },
    },
    orderBy: [{ datum: 'desc' }],
  })
}

export default async function ActiviteitenPage() {
  const session = await auth()

  if (session?.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const activiteiten = await getActiviteiten()

  return <ActiviteitenTable activiteiten={activiteiten} />
}
