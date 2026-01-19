import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getCurrentSchooljaar } from '@/lib/utils'
import Link from 'next/link'
import ScorekaartView from '@/app/(dashboard)/student/scorekaart/ScorekaartView'

export const metadata = {
  title: 'Student Scorekaart - Docent',
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

async function canViewStudent(docentId: string, studentId: string, isAdmin: boolean) {
  if (isAdmin) return true

  // Get student's opleiding
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { opleidingId: true },
  })

  if (!student?.opleidingId) return false

  // Check if docent is linked to student's opleiding
  const docentOpleiding = await prisma.docentOpleiding.findUnique({
    where: {
      docentId_opleidingId: {
        docentId,
        opleidingId: student.opleidingId,
      },
    },
  })

  return !!docentOpleiding
}

export default async function DocentStudentScorekaartPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  const { id: studentId } = await params

  // Check permissions
  const canView = await canViewStudent(
    session.user.id,
    studentId,
    session.user.role === 'admin'
  )

  if (!canView) {
    redirect('/docent/studenten')
  }

  // Get student info
  const student = await prisma.user.findUnique({
    where: { id: studentId, role: 'student' },
    include: { opleiding: true },
  })

  if (!student) {
    notFound()
  }

  const data = await getScorekaartData(studentId, student.opleidingId)

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/docent/studenten"
        className="text-pxl-gold hover:text-pxl-gold-dark font-medium inline-block"
      >
        &larr; Terug naar studenten
      </Link>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          Je bekijkt de scorekaart van <strong>{student.naam}</strong>
          {student.opleiding && <span> ({student.opleiding.naam})</span>}
        </p>
      </div>

      {/* Scorekaart */}
      <ScorekaartView
        data={data}
        studentNaam={student.naam}
        opleidingNaam={student.opleiding?.naam || null}
      />
    </div>
  )
}
