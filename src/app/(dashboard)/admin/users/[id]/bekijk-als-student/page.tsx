import { auth, canAccessOpleiding } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getCurrentSchooljaar } from '@/lib/utils'
import ScorekaartView, {
  type OpleidingTarget,
} from '@/app/(dashboard)/student/scorekaart/ScorekaartView'
import ImpersonationEnder from './ImpersonationEnder'

export const metadata = {
  title: 'Bekijk als student - Admin',
}

export default async function BekijkAlsStudentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (
    !session?.user ||
    (session.user.role !== 'admin' && session.user.role !== 'superadmin')
  ) {
    redirect('/dashboard')
  }

  const { id } = await params
  const student = await prisma.user.findUnique({
    where: { id },
    include: { opleiding: true },
  })
  if (!student || student.role !== 'student') notFound()

  // Autorisatie: opleidingsadmin enkel binnen eigen opleidingen; superadmin altijd.
  if (
    student.opleidingId &&
    session.user.role === 'admin' &&
    !(await canAccessOpleiding(session.user.id, student.opleidingId))
  ) {
    redirect('/admin/users')
  }

  const hdrs = await headers()
  const ipAdres = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const userAgent = hdrs.get('user-agent') || null

  const log = await prisma.impersonationLog.create({
    data: {
      adminId: session.user.id,
      targetUserId: student.id,
      actie: 'Bekeken als student',
      ipAdres,
      userAgent,
    },
  })

  const schooljaar = getCurrentSchooljaar()
  const [voortgang, target, inschrijvingen] = await Promise.all([
    prisma.studentVoortgang.findUnique({
      where: { studentId_schooljaar: { studentId: student.id, schooljaar } },
    }),
    student.opleidingId
      ? prisma.opleidingTarget.findUnique({
          where: {
            opleidingId_schooljaar: {
              opleidingId: student.opleidingId,
              schooljaar,
            },
          },
        })
      : null,
    prisma.inschrijving.findMany({
      where: {
        studentId: student.id,
        effectieveDeelname: true,
        bewijsStatus: 'goedgekeurd',
      },
      include: {
        activiteit: {
          include: {
            opleiding: true,
            duurzaamheid: { include: { duurzaamheid: true } },
          },
        },
      },
      orderBy: { activiteit: { datum: 'desc' } },
    }),
  ])

  return (
    <div className="space-y-6">
      <ImpersonationEnder logId={log.id} />

      <div className="border border-pxl-gold bg-yellow-50 text-pxl-black rounded p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold">
            👁️ Read-only weergave van <span className="text-pxl-gold">{student.naam}</span>
          </p>
          <p className="text-sm text-gray-600">
            Deze sessie wordt gelogd in ImpersonationLog. Sluit de tab om af te sluiten.
          </p>
        </div>
        <Link
          href={`/admin/users/${student.id}`}
          className="btn-secondary whitespace-nowrap"
        >
          ← Terug naar gebruiker
        </Link>
      </div>

      <ScorekaartView
        studentNaam={student.naam}
        opleidingNaam={student.opleiding?.naam ?? null}
        data={{
          schooljaar,
          voortgang: voortgang as Record<string, number> | null,
          target: target as OpleidingTarget | null,
          inschrijvingen: inschrijvingen.map((i) => ({
            id: i.id,
            effectieveDeelname: i.effectieveDeelname,
            activiteit: {
              id: i.activiteit.id,
              titel: i.activiteit.titel,
              typeActiviteit: i.activiteit.typeActiviteit,
              datum: i.activiteit.datum.toISOString(),
              startuur: i.activiteit.startuur,
              einduur: i.activiteit.einduur,
              locatie: i.activiteit.locatie,
              beentje: i.activiteit.beentje,
              niveau: i.activiteit.niveau,
              opleiding: i.activiteit.opleiding
                ? { naam: i.activiteit.opleiding.naam }
                : null,
              duurzaamheid: i.activiteit.duurzaamheid.map((d) => ({
                duurzaamheid: {
                  naam: d.duurzaamheid.naam,
                  icoon: d.duurzaamheid.icoon,
                },
              })),
            },
          })),
        }}
      />
    </div>
  )
}
