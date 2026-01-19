import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import AanvragenTable from './AanvragenTable'

export const metadata = {
  title: 'Student Aanvragen - Docent',
}

async function getDocentOpleidingen(userId: string) {
  const docentOpleidingen = await prisma.docentOpleiding.findMany({
    where: { docentId: userId },
    select: { opleidingId: true },
  })
  return docentOpleidingen.map((d) => d.opleidingId)
}

async function getAanvragen(opleidingIds: string[]) {
  // Get activiteiten that are student requests (typeAanvraag = 'student')
  // and are pending review (status = 'in_review')
  // for the opleidingen this docent is responsible for
  const aanvragen = await prisma.activiteit.findMany({
    where: {
      typeAanvraag: 'student',
      status: 'in_review',
      opleidingId: { in: opleidingIds },
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
    createdAt: a.createdAt.toISOString(),
  }))
}

export default async function AanvragenPage() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  const opleidingIds = await getDocentOpleidingen(session.user.id)

  if (opleidingIds.length === 0) {
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

  const aanvragen = await getAanvragen(opleidingIds)

  return <AanvragenTable aanvragen={aanvragen} />
}
