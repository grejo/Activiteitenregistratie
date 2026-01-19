import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import AanvraagDetails from './AanvraagDetails'

export const metadata = {
  title: 'Aanvraag Details - Docent',
}

async function getDocentOpleidingen(userId: string) {
  const docentOpleidingen = await prisma.docentOpleiding.findMany({
    where: { docentId: userId },
    select: { opleidingId: true },
  })
  return docentOpleidingen.map((d) => d.opleidingId)
}

async function getAanvraag(id: string, opleidingIds: string[]) {
  const aanvraag = await prisma.activiteit.findFirst({
    where: {
      id,
      typeAanvraag: 'student',
      opleidingId: { in: opleidingIds },
    },
    include: {
      aangemaaktDoor: {
        select: {
          id: true,
          naam: true,
          email: true,
          opleiding: {
            select: { naam: true },
          },
        },
      },
      opleiding: true,
      duurzaamheid: {
        include: {
          duurzaamheid: true,
        },
      },
    },
  })

  if (!aanvraag) return null

  return {
    ...aanvraag,
    datum: aanvraag.datum.toISOString(),
    createdAt: aanvraag.createdAt.toISOString(),
  }
}

export default async function AanvraagDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  const { id } = await params
  const opleidingIds = await getDocentOpleidingen(session.user.id)

  if (opleidingIds.length === 0) {
    redirect('/docent/aanvragen')
  }

  const aanvraag = await getAanvraag(id, opleidingIds)

  if (!aanvraag) {
    notFound()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/docent/aanvragen"
          className="text-pxl-gold hover:text-pxl-gold-dark font-medium mb-4 inline-block"
        >
          &larr; Terug naar aanvragen
        </Link>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Aanvraag Beoordelen
        </h1>
        <p className="text-pxl-black-light mt-4">
          Bekijk de details van deze student aanvraag
        </p>
      </div>

      <AanvraagDetails aanvraag={aanvraag} />
    </div>
  )
}
