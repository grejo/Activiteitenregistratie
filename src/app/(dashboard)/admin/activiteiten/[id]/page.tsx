import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import ActiviteitDetails from './ActiviteitDetails'

export const metadata = {
  title: 'Activiteit Beheren - Admin',
}

async function getActiviteit(id: string) {
  return await prisma.activiteit.findUnique({
    where: { id },
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
      evaluaties: {
        include: {
          criterium: true,
          niveau: true,
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

  if (session?.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const { id } = await params
  const activiteit = await getActiviteit(id)

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
