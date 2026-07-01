import { auth, getBeheerdeOpleidingIds } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import SjablonenPanel from './SjablonenPanel'

export const metadata = {
  title: 'Sjablonen - Admin',
}

export default async function SjablonenPage() {
  const session = await auth()
  if (
    !session?.user ||
    (session.user.role !== 'admin' && session.user.role !== 'superadmin')
  ) {
    redirect('/dashboard')
  }

  const beheerdeIds = await getBeheerdeOpleidingIds(session.user.id)
  const [sjablonen, opleidingen] = await Promise.all([
    prisma.sjabloon.findMany({
      where: beheerdeIds ? { opleidingId: { in: beheerdeIds } } : {},
      include: { opleiding: true },
      orderBy: [{ opleiding: { naam: 'asc' } }, { naam: 'asc' }],
    }),
    prisma.opleiding.findMany({
      where: beheerdeIds ? { id: { in: beheerdeIds } } : {},
      orderBy: { naam: 'asc' },
    }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Sjablonen
        </h1>
        <p className="text-pxl-black-light mt-4">
          Beheer downloadbare sjablonen per opleiding (bv. verslag, aanwezigheidslijst).
        </p>
      </div>
      <SjablonenPanel
        sjablonen={sjablonen.map((s) => ({
          id: s.id,
          naam: s.naam,
          beschrijving: s.beschrijving,
          bestandsnaam: s.bestandsnaam,
          opleiding: { id: s.opleiding.id, naam: s.opleiding.naam },
        }))}
        opleidingen={opleidingen.map((o) => ({ id: o.id, naam: o.naam }))}
      />
    </div>
  )
}
