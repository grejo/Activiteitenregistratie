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
    target: target as import('@/app/(dashboard)/student/scorekaart/ScorekaartView').OpleidingTarget | null,
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { opleiding: true },
  })

  if (!user) {
    notFound()
  }

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
            Scorekaarten zijn alleen beschikbaar voor studenten. Deze gebruiker heeft de rol &quot;
            {user.role}&quot;.
          </p>
        </div>
      </div>
    )
  }

  const data = await getScorekaartData(userId, user.opleidingId)

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/users/${userId}`}
        className="text-pxl-gold hover:text-pxl-gold-dark font-medium inline-block"
      >
        &larr; Terug naar gebruiker
      </Link>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          Je bekijkt de scorekaart van <strong>{user.naam}</strong>
          {user.opleiding && <span> ({user.opleiding.naam})</span>}
        </p>
      </div>

      <ScorekaartView
        data={data}
        studentNaam={user.naam}
        opleidingNaam={user.opleiding?.naam || null}
      />
    </div>
  )
}
