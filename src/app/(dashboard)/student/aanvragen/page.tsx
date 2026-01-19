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

  if (!session?.user || (session.user.role !== 'student' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  // Get student's opleiding for duurzaamheidsthemas
  const student = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { opleidingId: true },
  })

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
      <AanvragenTable aanvragen={aanvragen} duurzaamheidsThemas={duurzaamheidsThemas} />
    </Suspense>
  )
}
