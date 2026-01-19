import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import BewijsstukkenTable from './BewijsstukkenTable'

export const metadata = {
  title: 'Bewijsstukken - Student',
}

export default async function StudentBewijsstukkenPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'student') {
    redirect('/dashboard')
  }

  const userId = session.user.id

  // Get all inschrijvingen where:
  // 1. Student is ingeschreven (niet uitgeschreven)
  // 2. Docent activiteiten die gepubliceerd of goedgekeurd zijn
  // 3. Of eigen student activiteiten die goedgekeurd zijn
  const inschrijvingen = await prisma.inschrijving.findMany({
    where: {
      studentId: userId,
      inschrijvingsstatus: {
        notIn: ['uitgeschreven', 'geannuleerd'],
      },
      activiteit: {
        OR: [
          // Docent activiteiten waar student op ingeschreven is (gepubliceerd of goedgekeurd)
          { typeAanvraag: 'docent', status: { in: ['gepubliceerd', 'goedgekeurd', 'afgerond'] } },
          // Eigen student activiteiten die goedgekeurd zijn
          { typeAanvraag: 'student', status: 'goedgekeurd', aangemaaktDoorId: userId },
        ],
      },
    },
    include: {
      activiteit: {
        select: {
          id: true,
          titel: true,
          typeActiviteit: true,
          datum: true,
          startuur: true,
          einduur: true,
          locatie: true,
          typeAanvraag: true,
        },
      },
      bewijsstukken: {
        select: {
          id: true,
          bestandsnaam: true,
          bestandspad: true,
          type: true,
          uploadedAt: true,
        },
        orderBy: { uploadedAt: 'desc' },
      },
    },
    orderBy: {
      activiteit: {
        datum: 'desc',
      },
    },
  })

  // Markeer afgekeurde bewijsstukken als bekeken
  await prisma.inschrijving.updateMany({
    where: {
      studentId: userId,
      bewijsStatus: 'afgekeurd',
      bewijsAfgekeurdBekekenOp: null,
    },
    data: {
      bewijsAfgekeurdBekekenOp: new Date(),
    },
  })

  // Serialize dates
  const serializedInschrijvingen = inschrijvingen.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    uitgeschrevenOp: i.uitgeschrevenOp?.toISOString() || null,
    bewijsIngediendOp: i.bewijsIngediendOp?.toISOString() || null,
    bewijsBeoordeeldOp: i.bewijsBeoordeeldOp?.toISOString() || null,
    activiteit: {
      ...i.activiteit,
      datum: i.activiteit.datum.toISOString(),
    },
    bewijsstukken: i.bewijsstukken.map((b) => ({
      ...b,
      uploadedAt: b.uploadedAt.toISOString(),
    })),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-pxl-black">Bewijsstukken</h1>
        <div className="h-1 w-16 bg-pxl-gold mt-2"></div>
        <p className="text-pxl-black-light mt-4">
          Upload en beheer je bewijsstukken voor deelgenomen activiteiten
        </p>
      </div>

      <BewijsstukkenTable inschrijvingen={serializedInschrijvingen} />
    </div>
  )
}
