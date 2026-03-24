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

  const voortgang = await prisma.studentVoortgang.findUnique({
    where: { studentId_schooljaar: { studentId, schooljaar } },
  })

  const target = opleidingId
    ? await prisma.opleidingTarget.findUnique({
        where: { opleidingId_schooljaar: { opleidingId, schooljaar } },
      })
    : null

  const inschrijvingen = await prisma.inschrijving.findMany({
    where: {
      studentId,
      effectieveDeelname: true,
      bewijsStatus: 'goedgekeurd',
    },
    include: {
      activiteit: {
        include: {
          opleiding: true,
          duurzaamheid: {
            include: { duurzaamheid: true },
          },
        },
      },
    },
    orderBy: { activiteit: { datum: 'desc' } },
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

async function canViewStudent(docentId: string, studentId: string, isAdmin: boolean) {
  if (isAdmin) return true

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { opleidingId: true },
  })

  if (!student?.opleidingId) return false

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

  const canView = await canViewStudent(
    session.user.id,
    studentId,
    session.user.role === 'admin'
  )

  if (!canView) {
    redirect('/docent/studenten')
  }

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
      <Link
        href="/docent/studenten"
        className="text-pxl-gold hover:text-pxl-gold-dark font-medium inline-block"
      >
        &larr; Terug naar studenten
      </Link>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          Je bekijkt de scorekaart van <strong>{student.naam}</strong>
          {student.opleiding && <span> ({student.opleiding.naam})</span>}
        </p>
      </div>

      <ScorekaartView
        data={data}
        studentNaam={student.naam}
        opleidingNaam={student.opleiding?.naam || null}
      />
    </div>
  )
}
