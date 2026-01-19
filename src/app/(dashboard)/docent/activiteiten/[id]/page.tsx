import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import DocentActiviteitDetails from './DocentActiviteitDetails'

export const metadata = {
  title: 'Activiteit Details - Docent',
}

async function getActiviteit(id: string, userId: string) {
  const activiteit = await prisma.activiteit.findFirst({
    where: {
      id,
      aangemaaktDoorId: userId,
    },
    include: {
      opleiding: true,
      inschrijvingen: {
        include: {
          student: {
            include: {
              opleiding: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      duurzaamheid: {
        include: {
          duurzaamheid: true,
        },
      },
    },
  })

  if (!activiteit) return null

  // Serialize dates for client component
  return {
    ...activiteit,
    datum: activiteit.datum.toISOString(),
  }
}

export default async function ActiviteitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  const { id } = await params
  const activiteit = await getActiviteit(id, session.user.id)

  if (!activiteit) {
    notFound()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/docent/activiteiten"
          className="text-pxl-gold hover:text-pxl-gold-dark font-medium mb-4 inline-block"
        >
          &larr; Terug naar overzicht
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
              {activiteit.titel}
            </h1>
            <p className="text-pxl-black-light mt-4">
              Bekijk en beheer de details van deze activiteit
            </p>
          </div>
          <Link href={`/docent/activiteiten/${id}/edit`} className="btn-primary">
            Bewerken
          </Link>
        </div>
      </div>

      <DocentActiviteitDetails activiteit={activiteit} />
    </div>
  )
}
