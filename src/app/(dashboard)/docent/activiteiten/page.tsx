import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import DocentActiviteitenTable from './DocentActiviteitenTable'

export const metadata = {
  title: 'Mijn Activiteiten - Docent',
}

async function getDocentActiviteiten(userId: string) {
  const activiteiten = await prisma.activiteit.findMany({
    where: {
      aangemaaktDoorId: userId,
    },
    include: {
      opleiding: true,
      inschrijvingen: {
        include: {
          student: true,
        },
      },
    },
    orderBy: [{ datum: 'desc' }],
  })

  // Serialize dates for client component
  return activiteiten.map((a) => ({
    ...a,
    datum: a.datum.toISOString(),
  }))
}

async function getOpleidingen(userId: string) {
  // Get opleidingen the docent is linked to
  const docentOpleidingen = await prisma.docentOpleiding.findMany({
    where: { docentId: userId },
    include: { opleiding: true },
  })

  // If docent has opleidingen, return those, otherwise return all
  if (docentOpleidingen.length > 0) {
    return docentOpleidingen.map((d) => d.opleiding)
  }

  return await prisma.opleiding.findMany({
    orderBy: { naam: 'asc' },
  })
}

export default async function DocentActiviteitenPage() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  const [activiteiten, opleidingen] = await Promise.all([
    getDocentActiviteiten(session.user.id),
    getOpleidingen(session.user.id),
  ])

  return <DocentActiviteitenTable activiteiten={activiteiten} opleidingen={opleidingen} />
}
