import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getCurrentSchooljaar } from '@/lib/utils'
import EditOpleidingForm from './EditOpleidingForm'

export const metadata = {
  title: 'Opleiding Bewerken - Admin',
}

async function getOpleiding(id: string) {
  const schooljaar = getCurrentSchooljaar()

  const opleiding = await prisma.opleiding.findUnique({
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

  if (!opleiding) return null

  // Haal uren targets op voor huidig schooljaar
  const urenTargets = await prisma.opleidingUrenTarget.findUnique({
    where: {
      opleidingId_schooljaar: {
        opleidingId: id,
        schooljaar,
      },
    },
  })

  return {
    ...opleiding,
    urenTargets: urenTargets
      ? {
          urenNiveau1: urenTargets.urenNiveau1,
          urenNiveau2: urenTargets.urenNiveau2,
          urenNiveau3: urenTargets.urenNiveau3,
          urenNiveau4: urenTargets.urenNiveau4,
          urenNiveau5: urenTargets.urenNiveau5,
          urenDuurzaamheid: urenTargets.urenDuurzaamheid,
        }
      : null,
    schooljaar,
  }
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
          <div className="text-2xl font-bold text-pxl-gold">{opleiding._count.studenten}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Docenten</div>
          <div className="text-2xl font-bold text-blue-600">{opleiding._count.docenten}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Activiteiten</div>
          <div className="text-2xl font-bold text-green-600">{opleiding._count.activiteiten}</div>
        </div>
      </div>

      {/* Form */}
      <div className="card max-w-2xl">
        <EditOpleidingForm opleiding={opleiding} schooljaar={opleiding.schooljaar} />
      </div>
    </div>
  )
}
