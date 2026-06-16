import { auth, getBeheerdeOpleidingIds } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import ActiviteitForm from '../ActiviteitForm'

export const metadata = {
  title: 'Nieuwe Activiteit - Admin',
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

export default async function NewActiviteitPage() {
  const session = await auth()

  if (session?.user.role !== 'admin' && session?.user.role !== 'superadmin') {
    redirect('/dashboard')
  }

  const beheerdeIds = await getBeheerdeOpleidingIds(session.user.id)
  const opleidingen = await getOpleidingen(beheerdeIds)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Nieuwe Activiteit
        </h1>
        <p className="text-pxl-black-light mt-4">
          Maak een nieuwe activiteit aan in het systeem
        </p>
      </div>

      <div className="card max-w-3xl">
        <ActiviteitForm opleidingen={opleidingen} />
      </div>
    </div>
  )
}
