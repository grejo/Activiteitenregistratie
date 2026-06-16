import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import AanvragenTable from './AanvragenTable'

export const metadata = {
  title: 'Mijn Aanvragen - Student',
}

async function getAanvragen(userId: string) {
  const aanvragen = await prisma.activiteit.findMany({
    where: {
      aangemaaktDoorId: userId,
      typeAanvraag: 'student',
    },
    include: {
      opleiding: true,
      inschrijvingen: {
        where: { studentId: userId },
        select: {
          id: true,
          bewijsStatus: true,
          bewijsIngediendOp: true,
          bewijsBeoordeeldOp: true,
          bewijsFeedback: true,
          effectieveDeelname: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return aanvragen.map((a) => ({
    ...a,
    datum: a.datum.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    inschrijving: a.inschrijvingen[0] ? {
      ...a.inschrijvingen[0],
      bewijsIngediendOp: a.inschrijvingen[0].bewijsIngediendOp?.toISOString() || null,
      bewijsBeoordeeldOp: a.inschrijvingen[0].bewijsBeoordeeldOp?.toISOString() || null,
    } : null,
  }))
}

export default async function AanvragenPage() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'student' && session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    redirect('/dashboard')
  }

  // Get student's opleiding for duurzaamheidsthemas + niveaubeschrijvingen
  const student = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      opleidingId: true,
      opleiding: {
        select: {
          niveau1Beschrijving: true,
          niveau2Beschrijving: true,
          niveau3Beschrijving: true,
          niveau4Beschrijving: true,
        },
      },
    },
  })

  const niveauBeschrijvingen: Record<number, string | null> = {
    1: student?.opleiding?.niveau1Beschrijving ?? null,
    2: student?.opleiding?.niveau2Beschrijving ?? null,
    3: student?.opleiding?.niveau3Beschrijving ?? null,
    4: student?.opleiding?.niveau4Beschrijving ?? null,
  }

  // Get duurzaamheidsthemas for student's opleiding
  const duurzaamheidsThemas = student?.opleidingId
    ? await prisma.duurzaamheidsThema.findMany({
        where: {
          opleidingId: student.opleidingId,
          actief: true,
        },
        select: {
          id: true,
          naam: true,
        },
        orderBy: { volgorde: 'asc' },
      })
    : []

  const aanvragen = await getAanvragen(session.user.id)

  // Markeer afgekeurde aanvragen als bekeken
  await prisma.activiteit.updateMany({
    where: {
      aangemaaktDoorId: session.user.id,
      typeAanvraag: 'student',
      status: 'afgekeurd',
      afgekeurdBekekenOp: null,
    },
    data: {
      afgekeurdBekekenOp: new Date(),
    },
  })

  return (
    <Suspense fallback={<div className="animate-pulse">Laden...</div>}>
      <AanvragenTable
        aanvragen={aanvragen}
        duurzaamheidsThemas={duurzaamheidsThemas}
        niveauBeschrijvingen={niveauBeschrijvingen}
      />
    </Suspense>
  )
}
