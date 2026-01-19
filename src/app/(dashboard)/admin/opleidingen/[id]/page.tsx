import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import EditOpleidingForm from './EditOpleidingForm'

export const metadata = {
  title: 'Opleiding Bewerken - Admin',
}

async function getOpleiding(id: string) {
  return await prisma.opleiding.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          studenten: true,
          docenten: true,
          activiteiten: true,
        },
      },
    },
  })
}

export default async function EditOpleidingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (session?.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const { id } = await params
  const opleiding = await getOpleiding(id)

  if (!opleiding) {
    notFound()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          {opleiding.naam} Bewerken
        </h1>
        <p className="text-pxl-black-light mt-4">
          Bewerk de gegevens van deze opleiding
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Studenten</div>
          <div className="text-2xl font-bold text-pxl-gold">
            {opleiding._count.studenten}
          </div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Docenten</div>
          <div className="text-2xl font-bold text-blue-600">
            {opleiding._count.docenten}
          </div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Activiteiten</div>
          <div className="text-2xl font-bold text-green-600">
            {opleiding._count.activiteiten}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card max-w-2xl">
        <EditOpleidingForm opleiding={opleiding} />
      </div>
    </div>
  )
}
