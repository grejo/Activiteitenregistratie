import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import OpleidingenGrid from './OpleidingenGrid'

export const metadata = {
  title: 'Opleidingen - Admin',
}

async function getOpleidingen() {
  return await prisma.opleiding.findMany({
    include: {
      _count: {
        select: {
          studenten: true,
          docenten: true,
        },
      },
    },
    orderBy: [{ actief: 'desc' }, { naam: 'asc' }],
  })
}

export default async function OpleidingenPage() {
  const session = await auth()

  if (session?.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const opleidingen = await getOpleidingen()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
            Opleidingen
          </h1>
          <p className="text-pxl-black-light mt-4">Beheer alle opleidingen in het systeem</p>
        </div>
        <Link href="/admin/opleidingen/new" className="btn-primary">
          + Nieuwe Opleiding
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Totaal Opleidingen</div>
          <div className="text-2xl font-bold text-pxl-gold">{opleidingen.length}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Actieve Opleidingen</div>
          <div className="text-2xl font-bold text-green-600">
            {opleidingen.filter((o) => o.actief).length}
          </div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Totaal Studenten</div>
          <div className="text-2xl font-bold text-blue-600">
            {opleidingen.reduce((sum, o) => sum + o._count.studenten, 0)}
          </div>
        </div>
      </div>

      {/* Opleidingen Grid with Modal */}
      <OpleidingenGrid opleidingen={opleidingen} />
    </div>
  )
}
