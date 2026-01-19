import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import AanvragenTable from './AanvragenTable'

export const metadata = {
  title: 'Mijn Aanvragen - Student',
}

async function getAanvragen(userId: string) {
  const aanvragen = await prisma.activiteit.findMany({
    where: {
      aangemaaktDoorId: userId,
      typeAanvraag: 'student',
    },
    include: {
      opleiding: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return aanvragen.map((a) => ({
    ...a,
    datum: a.datum.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))
}

export default async function AanvragenPage() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'student' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  const aanvragen = await getAanvragen(session.user.id)

  return <AanvragenTable aanvragen={aanvragen} />
}
