import { auth, getBeheerdeOpleidingIds, opleidingScopeFilter } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import AanvragenTable from './AanvragenTable'

export const metadata = {
  title: 'Student Aanvragen - Docent',
}

async function getAanvragen(opleidingIds: string[] | null) {
  // Get activiteiten that are student requests (typeAanvraag = 'student')
  // and are pending review (status = 'in_review')
  // for the opleidingen this user reviews (docent: gekoppeld, admin: beheerd, superadmin: alle)
  const aanvragen = await prisma.activiteit.findMany({
    where: {
      typeAanvraag: 'student',
      status: 'in_review',
      opleidingId: opleidingScopeFilter(opleidingIds),
    },
    include: {
      aangemaaktDoor: {
        select: {
          id: true,
          naam: true,
          email: true,
          opleiding: {
            select: { naam: true },
          },
        },
      },
      opleiding: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return aanvragen.map((a) => ({
    ...a,
    datum: a.datum.toISOString(),
    einddatum: a.einddatum?.toISOString() || null,
    createdAt: a.createdAt.toISOString(),
  }))
}

// Historiek: aanvragen die deze gebruiker zelf goed- of afkeurde, recentste eerst
async function getHistoriek(userId: string) {
  const historiek = await prisma.activiteit.findMany({
    where: {
      typeAanvraag: 'student',
      beoordeeldDoorId: userId,
      status: { in: ['goedgekeurd', 'gepubliceerd', 'afgekeurd'] },
    },
    select: {
      id: true,
      titel: true,
      status: true,
      datum: true,
      einddatum: true,
      opmerkingen: true,
      beoordeeldOp: true,
      aangemaaktDoor: { select: { naam: true, email: true } },
      opleiding: { select: { naam: true } },
    },
    orderBy: { beoordeeldOp: 'desc' },
    take: 500,
  })

  return historiek.map((h) => ({
    ...h,
    datum: h.datum.toISOString(),
    einddatum: h.einddatum?.toISOString() || null,
    beoordeeldOp: h.beoordeeldOp?.toISOString() || null,
  }))
}

export default async function AanvragenPage() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    redirect('/dashboard')
  }

  const opleidingIds = await getBeheerdeOpleidingIds(session.user.id)

  if (opleidingIds !== null && opleidingIds.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
            Student Aanvragen
          </h1>
          <p className="text-pxl-black-light mt-4">
            Je bent niet gekoppeld aan een opleiding. Neem contact op met een administrator.
          </p>
        </div>
      </div>
    )
  }

  const [aanvragen, historiek] = await Promise.all([
    getAanvragen(opleidingIds),
    getHistoriek(session.user.id),
  ])

  return <AanvragenTable aanvragen={aanvragen} historiek={historiek} />
}
