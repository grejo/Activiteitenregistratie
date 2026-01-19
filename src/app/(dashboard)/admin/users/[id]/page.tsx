import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import EditUserForm from './EditUserForm'

export const metadata = {
  title: 'Gebruiker Bewerken - Admin',
}

async function getUser(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      opleiding: true,
    },
  })
}

async function getOpleidingen() {
  return await prisma.opleiding.findMany({
    where: { actief: true },
    orderBy: { naam: 'asc' },
  })
}

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (session?.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const { id } = await params
  const user = await getUser(id)

  if (!user) {
    notFound()
  }

  const opleidingen = await getOpleidingen()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Gebruiker Bewerken
        </h1>
        <p className="text-pxl-black-light mt-4">
          Bewerk de gegevens van {user.naam}
        </p>
      </div>

      {/* Form */}
      <div className="card max-w-2xl">
        <EditUserForm user={user} opleidingen={opleidingen} />
      </div>
    </div>
  )
}
