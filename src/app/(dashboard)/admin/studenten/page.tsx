import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import AdminStudentenTable from './AdminStudentenTable'

export const metadata = {
  title: 'Studenten - Admin',
}

async function getOpleidingen() {
  return await prisma.opleiding.findMany({
    where: { actief: true },
    orderBy: { naam: 'asc' },
  })
}

async function getStudenten() {
  const studenten = await prisma.user.findMany({
    where: {
      role: 'student',
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

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const [studenten, opleidingen] = await Promise.all([
    getStudenten(),
    getOpleidingen(),
  ])

  return <AdminStudentenTable studenten={studenten} opleidingen={opleidingen} />
}
