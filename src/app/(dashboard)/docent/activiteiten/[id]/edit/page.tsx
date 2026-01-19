import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import DocentActiviteitForm from '../../DocentActiviteitForm'

export const metadata = {
  title: 'Activiteit Bewerken - Docent',
}

async function getActiviteit(id: string, userId: string) {
  return await prisma.activiteit.findFirst({
    where: {
      id,
      aangemaaktDoorId: userId,
    },
  })
}

async function getOpleidingen(userId: string) {
  // Get opleidingen the docent is linked to
  const docentOpleidingen = await prisma.docentOpleiding.findMany({
    where: { docentId: userId },
    include: { opleiding: true },
  })

  // If docent has opleidingen, return those, otherwise return all
  if (docentOpleidingen.length > 0) {
    return docentOpleidingen.map((do_) => do_.opleiding)
  }

  return await prisma.opleiding.findMany({
    orderBy: { naam: 'asc' },
  })
}

export default async function EditActiviteitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  const { id } = await params
  const [activiteit, opleidingen] = await Promise.all([
    getActiviteit(id, session.user.id),
    getOpleidingen(session.user.id),
  ])

  if (!activiteit) {
    notFound()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/docent/activiteiten/${id}`}
          className="text-pxl-gold hover:text-pxl-gold-dark font-medium mb-4 inline-block"
        >
          &larr; Terug naar details
        </Link>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Activiteit Bewerken
        </h1>
        <p className="text-pxl-black-light mt-4">
          Bewerk de details van &quot;{activiteit.titel}&quot;
        </p>
      </div>

      {/* Form */}
      <div className="card max-w-3xl">
        <DocentActiviteitForm activiteit={activiteit} opleidingen={opleidingen} />
      </div>
    </div>
  )
}
