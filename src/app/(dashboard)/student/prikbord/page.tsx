import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PrikbordTable from './PrikbordTable'

export const metadata = {
  title: 'Prikbord - Student',
}

async function getActiviteiten(opleidingId: string | null) {
  const activiteiten = await prisma.activiteit.findMany({
    where: {
      status: 'gepubliceerd',
      typeAanvraag: 'docent',
      datum: { gte: new Date() },
      OR: [
        { opleidingId: null },
        { opleidingId: opleidingId || undefined },
      ],
    },
    include: {
      opleiding: true,
      aangemaaktDoor: {
        select: {
          naam: true,
        },
      },
      _count: {
        select: {
          inschrijvingen: {
            where: { inschrijvingsstatus: 'ingeschreven' },
          },
        },
      },
    },
    orderBy: { datum: 'asc' },
  })

  return activiteiten.map((a) => ({
    ...a,
    datum: a.datum.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))
}

async function getMijnInschrijvingen(userId: string) {
  const inschrijvingen = await prisma.inschrijving.findMany({
    where: {
      studentId: userId,
      inschrijvingsstatus: 'ingeschreven',
    },
    select: {
      activiteitId: true,
    },
  })

  return inschrijvingen.map((i) => i.activiteitId)
}

export default async function PrikbordPage() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'student' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  const [activiteiten, mijnInschrijvingen] = await Promise.all([
    getActiviteiten(session.user.opleidingId || null),
    getMijnInschrijvingen(session.user.id),
  ])

  return (
    <PrikbordTable
      activiteiten={activiteiten}
      mijnInschrijvingen={mijnInschrijvingen}
    />
  )
}
