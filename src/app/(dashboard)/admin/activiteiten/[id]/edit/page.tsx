import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import ActiviteitForm from '../../ActiviteitForm'

export const metadata = {
  title: 'Activiteit Bewerken - Admin',
}

async function getActiviteit(id: string) {
  return await prisma.activiteit.findUnique({
    where: { id },
    include: {
      opleiding: true,
      duurzaamheid: {
        include: {
          duurzaamheid: true,
        },
      },
    },
  })
}

async function getOpleidingen() {
  return await prisma.opleiding.findMany({
    where: { actief: true },
    orderBy: { naam: 'asc' },
  })
}

export default async function EditActiviteitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (session?.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const { id } = await params
  const [activiteit, opleidingen] = await Promise.all([
    getActiviteit(id),
    getOpleidingen(),
  ])

  if (!activiteit) {
    notFound()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Activiteit Bewerken
        </h1>
        <p className="text-pxl-black-light mt-4">
          Bewerk de gegevens van deze activiteit
        </p>
      </div>

      <div className="card max-w-3xl">
        <ActiviteitForm activiteit={activiteit} opleidingen={opleidingen} />
      </div>
    </div>
  )
}
