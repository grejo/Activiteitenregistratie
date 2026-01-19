import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import BewijsstukkenBeoordelenTable from './BewijsstukkenBeoordelenTable'

export const metadata = {
  title: 'Bewijsstukken Beoordelen - Docent',
}

async function getIngediendeBewijsstukken(docentId: string) {
  // Haal opleidingen van de docent op
  const docentOpleidingen = await prisma.docentOpleiding.findMany({
    where: { docentId },
    select: { opleidingId: true },
  })

  const opleidingIds = docentOpleidingen.map((d) => d.opleidingId)

  const inschrijvingen = await prisma.inschrijving.findMany({
    where: {
      bewijsStatus: 'ingediend',
      student: {
        opleidingId: { in: opleidingIds },
      },
    },
    include: {
      bewijsstukken: {
        orderBy: { uploadedAt: 'desc' },
      },
      activiteit: {
        select: {
          id: true,
          titel: true,
          typeActiviteit: true,
          datum: true,
          startuur: true,
          einduur: true,
          locatie: true,
        },
      },
      student: {
        select: {
          id: true,
          naam: true,
          email: true,
          opleiding: {
            select: { naam: true },
          },
        },
      },
    },
    orderBy: { bewijsIngediendOp: 'asc' }, // Oudste eerst
  })

  return inschrijvingen.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    bewijsIngediendOp: i.bewijsIngediendOp?.toISOString() || null,
    bewijsBeoordeeldOp: i.bewijsBeoordeeldOp?.toISOString() || null,
    activiteit: {
      ...i.activiteit,
      datum: i.activiteit.datum.toISOString(),
    },
    bewijsstukken: i.bewijsstukken.map((b) => ({
      ...b,
      uploadedAt: b.uploadedAt.toISOString(),
    })),
  }))
}

export default async function BewijsstukkenPage() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
    redirect('/login')
  }

  const inschrijvingen = await getIngediendeBewijsstukken(session.user.id)

  return <BewijsstukkenBeoordelenTable inschrijvingen={inschrijvingen} />
}
