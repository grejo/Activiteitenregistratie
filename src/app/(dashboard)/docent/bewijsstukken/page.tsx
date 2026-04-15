import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import BewijsstukkenBeoordelenTable from './BewijsstukkenBeoordelenTable'

export const metadata = {
  title: 'Bewijsstukken Beoordelen - Docent',
}

async function getIngediendeBewijsstukken(docentId: string, isAdmin: boolean) {
  let whereClause: Record<string, unknown> = { bewijsStatus: 'ingediend' }

  if (!isAdmin) {
    // Haal opleidingen van de docent op
    const docentOpleidingen = await prisma.docentOpleiding.findMany({
      where: { docentId },
      select: { opleidingId: true },
    })
    const opleidingIds = docentOpleidingen.map((d) => d.opleidingId)

    if (opleidingIds.length > 0) {
      // Docent is gekoppeld aan opleidingen: filter op activiteit.opleidingId of student.opleidingId
      whereClause = {
        bewijsStatus: 'ingediend',
        OR: [
          { activiteit: { opleidingId: { in: opleidingIds } } },
          { activiteit: { aangemaaktDoorId: docentId } },
          { student: { opleidingId: { in: opleidingIds } } },
        ],
      }
    }
    // Als docent geen opleiding-links heeft: toon alle ingediende bewijsstukken
  }

  const inschrijvingen = await prisma.inschrijving.findMany({
    where: whereClause,
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
          niveau: true,
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

  const inschrijvingen = await getIngediendeBewijsstukken(session.user.id, session.user.role === 'admin')

  return <BewijsstukkenBeoordelenTable inschrijvingen={inschrijvingen} />
}
