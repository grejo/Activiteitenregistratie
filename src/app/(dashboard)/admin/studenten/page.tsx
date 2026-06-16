import { auth, getBeheerdeOpleidingIds } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import AdminStudentenTable from './AdminStudentenTable'

export const metadata = {
  title: 'Studenten - Admin',
}

async function getOpleidingen(beheerdeIds: string[] | null) {
  return await prisma.opleiding.findMany({
    where: {
      actief: true,
      ...(beheerdeIds ? { id: { in: beheerdeIds } } : {}),
    },
    orderBy: { naam: 'asc' },
  })
}

async function getStudenten(beheerdeIds: string[] | null) {
  const studenten = await prisma.user.findMany({
    where: {
      role: 'student',
      ...(beheerdeIds ? { opleidingId: { in: beheerdeIds } } : {}),
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
    updatedAt: s.updatedAt.toISOString(),
    gearchiveerdOp: s.gearchiveerdOp?.toISOString() || null,
    inschrijvingen: s.inschrijvingen.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
      uitgeschrevenOp: i.uitgeschrevenOp?.toISOString() || null,
      activiteit: {
        ...i.activiteit,
        datum: i.activiteit.datum.toISOString(),
      },
    })),
  }))
}

export default async function AdminStudentenPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'admin' && session.user.role !== 'superadmin') {
    redirect('/dashboard')
  }

  const beheerdeIds = await getBeheerdeOpleidingIds(session.user.id)
  const [studenten, opleidingen] = await Promise.all([
    getStudenten(beheerdeIds),
    getOpleidingen(beheerdeIds),
  ])

  return <AdminStudentenTable studenten={studenten} opleidingen={opleidingen} />
}
