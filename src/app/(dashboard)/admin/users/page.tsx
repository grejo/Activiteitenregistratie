import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import UsersTable from './UsersTable'

export const metadata = {
  title: 'Gebruikersbeheer - Admin',
}

export default async function UsersPage() {
  const session = await auth()

  if (session?.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const [users, opleidingen] = await Promise.all([
    prisma.user.findMany({
      include: { opleiding: true },
      orderBy: [{ actief: 'desc' }, { role: 'asc' }, { naam: 'asc' }],
    }),
    prisma.opleiding.findMany({ orderBy: { naam: 'asc' } }),
  ])

  return <UsersTable users={users} opleidingen={opleidingen} />
}
