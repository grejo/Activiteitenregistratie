import { auth, getBeheerdeOpleidingIds, activiteitScopeWhere } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import ActiviteitDetails from './ActiviteitDetails'

export const metadata = {
  title: 'Activiteit Beheren - Admin',
}

async function getActiviteit(id: string, beheerdeIds: string[] | null) {
  return await prisma.activiteit.findFirst({
    where: { id, ...activiteitScopeWhere(beheerdeIds) },
    include: {
      aangemaaktDoor: {
        include: {
          opleiding: true,
        },
      },
      opleiding: true,
      duurzaamheid: {
        include: {
          duurzaamheid: true,
        },
      },
      inschrijvingen: {
        include: {
          student: {
            include: {
              opleiding: true,
            },
          },
        },
      },
    },
  })
}

export default async function ActiviteitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (session?.user.role !== 'admin' && session?.user.role !== 'superadmin') {
    redirect('/dashboard')
  }

  const { id } = await params
  const activiteit = await getActiviteit(id, await getBeheerdeOpleidingIds(session.user.id))

  if (!activiteit) {
    notFound()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Activiteit Beheren
        </h1>
        <p className="text-pxl-black-light mt-4">
          Bekijk, bewerk, goedkeur of verwijder deze activiteit
        </p>
      </div>

      <ActiviteitDetails activiteit={activiteit} />
    </div>
  )
}
