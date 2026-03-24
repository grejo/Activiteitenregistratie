import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getCurrentSchooljaar } from '@/lib/utils'
import ScorekaartView from './ScorekaartView'

export const metadata = {
  title: 'Scorekaart - Student',
}

async function getScorekaartData(userId: string, opleidingId: string | null) {
  const schooljaar = getCurrentSchooljaar()

  // Haal studentvoortgang op
  const voortgang = await prisma.studentVoortgang.findUnique({
    where: { studentId_schooljaar: { studentId: userId, schooljaar } },
  })

  // Haal opleiding targets op
  const target = opleidingId
    ? await prisma.opleidingTarget.findUnique({
        where: { opleidingId_schooljaar: { opleidingId, schooljaar } },
      })
    : null

  // Haal goedgekeurde inschrijvingen op voor de activiteiten lijst
  const inschrijvingen = await prisma.inschrijving.findMany({
    where: {
      studentId: userId,
      effectieveDeelname: true,
      bewijsStatus: 'goedgekeurd',
    },
    include: {
      activiteit: {
        include: {
          opleiding: true,
          duurzaamheid: {
            include: {
              duurzaamheid: true,
            },
          },
        },
      },
    },
    orderBy: {
      activiteit: { datum: 'desc' },
    },
  })

  return {
    schooljaar,
    voortgang: voortgang as Record<string, number> | null,
    target: target as Record<string, number> | null,
    inschrijvingen: inschrijvingen.map((i) => ({
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
    })),
  }
}

export default async function ScorekaartPage() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'student' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  const data = await getScorekaartData(session.user.id, session.user.opleidingId || null)

  return (
    <ScorekaartView
      data={data}
      studentNaam={session.user.naam}
      opleidingNaam={session.user.opleidingNaam || null}
    />
  )
}
