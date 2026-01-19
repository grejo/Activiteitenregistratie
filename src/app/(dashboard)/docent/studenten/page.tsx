import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import StudentenTable from './StudentenTable'

export const metadata = {
  title: 'Studenten - Docent',
}

async function getDocentOpleidingen(userId: string) {
  const docentOpleidingen = await prisma.docentOpleiding.findMany({
    where: { docentId: userId },
    include: { opleiding: true },
  })
  return docentOpleidingen.map((d) => ({
    id: d.opleidingId,
    naam: d.opleiding.naam,
    isCoordinator: d.isCoordinator,
  }))
}

async function getStudenten(opleidingIds: string[]) {
  const studenten = await prisma.user.findMany({
    where: {
      role: 'student',
      opleidingId: { in: opleidingIds },
      actief: true,
    },
    include: {
      opleiding: true,
      inschrijvingen: {
        include: {
          activiteit: {
            select: {
              id: true,
              titel: true,
              datum: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: {
        select: {
          inschrijvingen: {
            where: { effectieveDeelname: true },
          },
        },
      },
    },
    orderBy: { naam: 'asc' },
  })

  return studenten.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    inschrijvingen: s.inschrijvingen.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      activiteit: {
        ...i.activiteit,
        datum: i.activiteit.datum.toISOString(),
      },
    })),
  }))
}

export default async function StudentenPage() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  const opleidingen = await getDocentOpleidingen(session.user.id)

  if (opleidingen.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
            Studenten
          </h1>
          <p className="text-pxl-black-light mt-4">
            Je bent niet gekoppeld aan een opleiding. Neem contact op met een administrator.
          </p>
        </div>
      </div>
    )
  }

  const opleidingIds = opleidingen.map((o) => o.id)
  const studenten = await getStudenten(opleidingIds)

  return <StudentenTable studenten={studenten} opleidingen={opleidingen} />
}
