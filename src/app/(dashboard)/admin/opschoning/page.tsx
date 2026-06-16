import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import OpschoningTable from './OpschoningTable'

export const metadata = {
  title: 'Studentenopschoning - Admin',
}

async function getOpschoonbareStudenten() {
  const studenten = await prisma.user.findMany({
    where: {
      role: 'student',
      OR: [{ actief: false }, { gearchiveerdOp: { not: null } }],
      inschrijvingen: {
        some: { bewijsstukken: { some: { bestandVerwijderdOp: null } } },
      },
    },
    select: {
      id: true,
      naam: true,
      email: true,
      actief: true,
      gearchiveerdOp: true,
      opleiding: { select: { naam: true } },
      _count: {
        select: {
          inschrijvingen: true,
        },
      },
    },
    orderBy: { naam: 'asc' },
  })

  // Tel per student de nog te verwijderen bestanden
  const metAantal = await Promise.all(
    studenten.map(async (s) => {
      const aantalBestanden = await prisma.bewijsstuk.count({
        where: { inschrijving: { studentId: s.id }, bestandVerwijderdOp: null },
      })
      return {
        id: s.id,
        naam: s.naam,
        email: s.email,
        actief: s.actief,
        gearchiveerd: !!s.gearchiveerdOp,
        opleiding: s.opleiding?.naam ?? null,
        aantalBestanden,
      }
    })
  )

  return metAantal.filter((s) => s.aantalBestanden > 0)
}

export default async function OpschoningPage() {
  const session = await auth()

  // Studentenopschoning is een departementale actie — enkel superadmin
  if (session?.user.role !== 'superadmin') {
    redirect('/dashboard')
  }

  const studenten = await getOpschoonbareStudenten()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Studentenopschoning
        </h1>
        <p className="text-pxl-black-light mt-4 max-w-3xl">
          Verwijder de bewijsstukken (foto&apos;s, PDF&apos;s) van uitgeschreven en
          afgestudeerde studenten conform het bewaarbeleid. De <strong>metadata</strong>{' '}
          (type, bestandsnaam, datum) van elk bewijsstuk blijft bewaard; enkel het
          fysieke bestand wordt verwijderd. Voer dit bijvoorbeeld jaarlijks uit rond
          30 september.
        </p>
      </div>

      <OpschoningTable studenten={studenten} />
    </div>
  )
}
