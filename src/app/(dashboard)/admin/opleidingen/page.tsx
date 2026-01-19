import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'

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
          <p className="text-pxl-black-light mt-4">
            Beheer alle opleidingen in het systeem
          </p>
        </div>
        <Link href="/admin/opleidingen/new" className="btn-primary">
          ➕ Nieuwe Opleiding
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

      {/* Opleidingen Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {opleidingen.map((opleiding) => (
          <div
            key={opleiding.id}
            className={`card ${!opleiding.actief ? 'opacity-50' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-heading font-bold text-xl text-pxl-black">
                {opleiding.naam}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  opleiding.actief
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {opleiding.actief ? 'Actief' : 'Inactief'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-pxl-black-light">Studenten:</span>
                <span className="font-semibold text-pxl-black">
                  {opleiding._count.studenten}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-pxl-black-light">Docenten:</span>
                <span className="font-semibold text-pxl-black">
                  {opleiding._count.docenten}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/admin/opleidingen/${opleiding.id}`}
                className="btn-secondary flex-1 text-center"
              >
                Bewerken
              </Link>
              <Link
                href={`/admin/opleidingen/${opleiding.id}/users`}
                className="btn-secondary flex-1 text-center"
              >
                Gebruikers
              </Link>
            </div>
          </div>
        ))}
      </div>

      {opleidingen.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🏫</div>
          <h3 className="font-heading font-bold text-xl text-pxl-black mb-2">
            Geen opleidingen gevonden
          </h3>
          <p className="text-pxl-black-light mb-4">
            Voeg je eerste opleiding toe om te beginnen
          </p>
          <Link href="/admin/opleidingen/new" className="btn-primary inline-block">
            ➕ Nieuwe Opleiding
          </Link>
        </div>
      )}
    </div>
  )
}
