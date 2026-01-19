import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import NewUserForm from './NewUserForm'

export const metadata = {
  title: 'Nieuwe Gebruiker - Admin',
}

async function getOpleidingen() {
  return await prisma.opleiding.findMany({
    where: { actief: true },
    orderBy: { naam: 'asc' },
  })
}

export default async function NewUserPage() {
  const session = await auth()

  if (session?.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const opleidingen = await getOpleidingen()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Nieuwe Gebruiker
        </h1>
        <p className="text-pxl-black-light mt-4">
          Maak een nieuwe gebruiker aan in het systeem
        </p>
      </div>

      {/* Form */}
      <div className="card max-w-2xl">
        <NewUserForm opleidingen={opleidingen} />
      </div>
    </div>
  )
}
