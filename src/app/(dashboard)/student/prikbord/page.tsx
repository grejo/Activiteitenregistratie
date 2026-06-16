import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PrikbordTable from './PrikbordTable'

export const metadata = {
  title: 'Prikbord - Student',
}

async function getActiviteiten(opleidingId: string | null, userId: string) {
  // Zichtbaar op het prikbord van de student: activiteiten die aan zijn opleiding
  // gekoppeld zijn (via de ActiviteitOpleiding-join), plus departementale activiteiten
  // (geen koppeling én geen primaire opleiding) die voor alle opleidingen gelden.
  const zichtbaarVoorOpleiding = [
    ...(opleidingId
      ? [
          { opleidingen: { some: { opleidingId } } },
          // Backward-compat: oudere activiteiten zonder join-rijen
          { opleidingId },
        ]
      : []),
    { opleidingId: null, opleidingen: { none: {} } },
  ]

  const activiteiten = await prisma.activiteit.findMany({
    where: {
      datum: { gte: new Date() },
      OR: [
        {
          status: 'gepubliceerd',
          typeAanvraag: 'docent',
          OR: zichtbaarVoorOpleiding,
        },
        {
          status: 'gepubliceerd',
          typeAanvraag: 'student',
          openVoorMedestudenten: true,
          aangemaaktDoorId: { not: userId },
          OR: zichtbaarVoorOpleiding,
        },
      ],
    },
    include: {
      opleiding: true,
      aangemaaktDoor: {
        select: { naam: true },
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

  if (!session?.user || (session.user.role !== 'student' && session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    redirect('/dashboard')
  }

  const [activiteiten, mijnInschrijvingen] = await Promise.all([
    getActiviteiten(session.user.opleidingId || null, session.user.id),
    getMijnInschrijvingen(session.user.id),
  ])

  return (
    <PrikbordTable
      activiteiten={activiteiten}
      mijnInschrijvingen={mijnInschrijvingen}
    />
  )
}
