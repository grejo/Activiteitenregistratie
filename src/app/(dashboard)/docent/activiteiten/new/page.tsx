import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import DocentActiviteitForm from '../DocentActiviteitForm'

export const metadata = {
  title: 'Nieuwe Activiteit - Docent',
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

export default async function NewActiviteitPage() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  const opleidingen = await getOpleidingen(session.user.id)

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
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Nieuwe Activiteit
        </h1>
        <p className="text-pxl-black-light mt-4">
          Maak een nieuwe activiteit aan voor studenten
        </p>
      </div>

      {/* Form */}
      <div className="card max-w-3xl">
        <DocentActiviteitForm opleidingen={opleidingen} />
      </div>
    </div>
  )
}
