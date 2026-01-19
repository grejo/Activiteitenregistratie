import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getCurrentSchooljaar } from '@/lib/utils'
import Link from 'next/link'
import ScorekaartView from '@/app/(dashboard)/student/scorekaart/ScorekaartView'

export const metadata = {
  title: 'Student Scorekaart - Admin',
}

async function getScorekaartData(studentId: string, opleidingId: string | null) {
  const schooljaar = getCurrentSchooljaar()

  // Get student's uren voortgang
  const urenVoortgang = await prisma.studentUrenVoortgang.findUnique({
    where: {
      studentId_schooljaar: {
        studentId,
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
      studentId,
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
      studentId,
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

export default async function AdminStudentScorekaartPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const { id: userId } = await params

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { opleiding: true },
  })

  if (!user) {
    notFound()
  }

  // Only show scorekaart for students
  if (user.role !== 'student') {
    return (
      <div className="space-y-6">
        <Link
          href={`/admin/users/${userId}`}
          className="text-pxl-gold hover:text-pxl-gold-dark font-medium inline-block"
        >
          &larr; Terug naar gebruiker
        </Link>

        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="font-heading font-bold text-xl text-pxl-black mb-2">
            Geen scorekaart beschikbaar
          </h3>
          <p className="text-pxl-black-light">
            Scorekaarten zijn alleen beschikbaar voor studenten. Deze gebruiker heeft de rol &quot;{user.role}&quot;.
          </p>
        </div>
      </div>
    )
  }

  const data = await getScorekaartData(userId, user.opleidingId)

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/admin/users/${userId}`}
        className="text-pxl-gold hover:text-pxl-gold-dark font-medium inline-block"
      >
        &larr; Terug naar gebruiker
      </Link>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          Je bekijkt de scorekaart van <strong>{user.naam}</strong>
          {user.opleiding && <span> ({user.opleiding.naam})</span>}
        </p>
      </div>

      {/* Scorekaart */}
      <ScorekaartView
        data={data}
        studentNaam={user.naam}
        opleidingNaam={user.opleiding?.naam || null}
      />
    </div>
  )
}
