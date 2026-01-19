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

  // Get student's uren voortgang
  const urenVoortgang = await prisma.studentUrenVoortgang.findUnique({
    where: {
      studentId_schooljaar: {
        studentId: userId,
        schooljaar,
      },
    },
  })

  // Get opleiding uren targets
  let urenTargets = null
  if (opleidingId) {
    urenTargets = await prisma.opleidingUrenTarget.findUnique({
      where: {
        opleidingId_schooljaar: {
          opleidingId,
          schooljaar,
        },
      },
    })
  }

  // Get all completed activities (effectieve deelname)
  const inschrijvingen = await prisma.inschrijving.findMany({
    where: {
      studentId: userId,
      effectieveDeelname: true,
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
          evaluaties: {
            include: {
              criterium: {
                include: {
                  sectie: true,
                },
              },
              niveau: true,
            },
          },
        },
      },
    },
    orderBy: {
      activiteit: {
        datum: 'desc',
      },
    },
  })

  // Get rubric for this opleiding (if exists)
  let rubric = null
  if (opleidingId) {
    rubric = await prisma.evaluatieRubric.findFirst({
      where: {
        opleidingId,
        actief: true,
      },
      include: {
        secties: {
          include: {
            criteria: true,
          },
          orderBy: { volgorde: 'asc' },
        },
        niveaus: {
          orderBy: { volgorde: 'asc' },
        },
      },
    })
  }

  // Get student criterium uren
  const criteriumUren = await prisma.studentCriteriumUren.findMany({
    where: {
      studentId: userId,
      schooljaar,
    },
    include: {
      criterium: {
        include: {
          sectie: true,
        },
      },
    },
  })

  return {
    schooljaar,
    urenVoortgang: urenVoortgang
      ? {
          ...urenVoortgang,
          lastCalculated: urenVoortgang.lastCalculated.toISOString(),
        }
      : null,
    urenTargets,
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
    rubric: rubric
      ? {
          ...rubric,
          createdAt: rubric.createdAt.toISOString(),
          updatedAt: rubric.updatedAt.toISOString(),
        }
      : null,
    criteriumUren: criteriumUren.map((cu) => ({
      ...cu,
      updatedAt: cu.updatedAt.toISOString(),
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
