import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import InschrijvingenTable from './InschrijvingenTable'

export const metadata = {
  title: 'Mijn Inschrijvingen - Student',
}

async function getInschrijvingen(userId: string) {
  const inschrijvingen = await prisma.inschrijving.findMany({
    where: {
      studentId: userId,
    },
    include: {
      activiteit: {
        include: {
          opleiding: true,
          aangemaaktDoor: {
            select: { naam: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return inschrijvingen.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    uitgeschrevenOp: i.uitgeschrevenOp?.toISOString() || null,
    activiteit: {
      ...i.activiteit,
      datum: i.activiteit.datum.toISOString(),
      createdAt: i.activiteit.createdAt.toISOString(),
      updatedAt: i.activiteit.updatedAt.toISOString(),
    },
  }))
}

export default async function InschrijvingenPage() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'student' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  const inschrijvingen = await getInschrijvingen(session.user.id)

  return <InschrijvingenTable inschrijvingen={inschrijvingen} />
}
