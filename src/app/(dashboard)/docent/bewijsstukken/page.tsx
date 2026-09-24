import { auth, getBeheerdeOpleidingIds, bewijsScopeWhere } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import BewijsstukkenBeoordelenTable from './BewijsstukkenBeoordelenTable'

export const metadata = {
  title: 'Bewijsstukken Beoordelen - Docent',
}

async function getIngediendeBewijsstukken(userId: string) {
  // Docent: gekoppelde opleidingen, admin: beheerde opleidingen, superadmin: alle
  const opleidingIds = await getBeheerdeOpleidingIds(userId)
  const whereClause = { bewijsStatus: 'ingediend', ...bewijsScopeWhere(userId, opleidingIds) }

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
          einddatum: true,
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
      einddatum: i.activiteit.einddatum?.toISOString() || null,
    },
    bewijsstukken: i.bewijsstukken.map((b) => ({
      ...b,
      uploadedAt: b.uploadedAt.toISOString(),
    })),
  }))
}

export default async function BewijsstukkenPage() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    redirect('/dashboard')
  }

  const inschrijvingen = await getIngediendeBewijsstukken(session.user.id)

  return <BewijsstukkenBeoordelenTable inschrijvingen={inschrijvingen} />
}
