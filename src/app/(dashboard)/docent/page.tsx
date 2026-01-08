import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Docent Dashboard - Activiteitenregistratie',
}

async function getDocentStats(userId: string) {
  // Haal de opleidingen op waar deze docent aan gekoppeld is
  const docentOpleidingen = await prisma.docentOpleiding.findMany({
    where: { docentId: userId },
    include: { opleiding: true },
  })

  const opleidingIds = docentOpleidingen.map((do_) => do_.opleidingId)

  const [
    mijnActiviteiten,
    pendingAanvragen,
    totalInschrijvingen,
    teValiderenDeelnames,
  ] = await Promise.all([
    prisma.activiteit.count({
      where: { aangemaaktDoorId: userId },
    }),
    prisma.activiteit.count({
      where: {
        typeAanvraag: 'student',
        status: 'in_review',
        opleidingId: { in: opleidingIds },
      },
    }),
    prisma.inschrijving.count({
      where: {
        activiteit: { aangemaaktDoorId: userId },
        inschrijvingsstatus: 'ingeschreven',
      },
    }),
    prisma.inschrijving.count({
      where: {
        activiteit: {
          aangemaaktDoorId: userId,
          datum: { lt: new Date() },
        },
        effectieveDeelname: false,
        inschrijvingsstatus: 'ingeschreven',
      },
    }),
  ])

  return {
    opleidingen: docentOpleidingen.map((do_) => ({
      ...do_.opleiding,
      isCoordinator: do_.isCoordinator,
    })),
    mijnActiviteiten,
    pendingAanvragen,
    totalInschrijvingen,
    teValiderenDeelnames,
  }
}

export default async function DocentDashboard() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  const stats = await getDocentStats(session.user.id)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Docent Dashboard
        </h1>
        <p className="text-pxl-black-light mt-4">
          Welkom, {session.user.naam}. Beheer je activiteiten en beoordeel aanvragen.
        </p>
      </div>

      {/* Opleidingen */}
      {stats.opleidingen.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.opleidingen.map((opl) => (
            <span
              key={opl.id}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                opl.isCoordinator
                  ? 'bg-pxl-gold text-pxl-black'
                  : 'bg-pxl-gray-light text-pxl-black'
              }`}
            >
              {opl.naam} {opl.isCoordinator && '(Coordinator)'}
            </span>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="text-4xl mb-2">📅</div>
          <div className="text-3xl font-bold text-pxl-gold">{stats.mijnActiviteiten}</div>
          <div className="text-pxl-black-light">Mijn Activiteiten</div>
        </div>

        <div className="card">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-3xl font-bold text-pxl-gold">{stats.totalInschrijvingen}</div>
          <div className="text-pxl-black-light">Totaal Inschrijvingen</div>
        </div>

        {stats.pendingAanvragen > 0 && (
          <div className="card border-t-yellow-500">
            <div className="text-4xl mb-2">⏳</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingAanvragen}</div>
            <div className="text-pxl-black-light">Te Beoordelen</div>
          </div>
        )}

        {stats.teValiderenDeelnames > 0 && (
          <div className="card border-t-blue-500">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-3xl font-bold text-blue-600">{stats.teValiderenDeelnames}</div>
            <div className="text-pxl-black-light">Te Valideren</div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-heading font-bold text-xl mb-4">Snelle Acties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/docent/activiteiten/new"
            className="card-flat flex items-center gap-4 hover:bg-pxl-gold-light transition-colors"
          >
            <span className="text-3xl">➕</span>
            <div>
              <div className="font-semibold">Nieuwe Activiteit</div>
              <div className="text-sm text-pxl-black-light">Maak een activiteit aan</div>
            </div>
          </Link>

          <Link
            href="/docent/activiteiten"
            className="card-flat flex items-center gap-4 hover:bg-pxl-gold-light transition-colors"
          >
            <span className="text-3xl">📋</span>
            <div>
              <div className="font-semibold">Mijn Activiteiten</div>
              <div className="text-sm text-pxl-black-light">Beheer je activiteiten</div>
            </div>
          </Link>

          <Link
            href="/docent/aanvragen"
            className="card-flat flex items-center gap-4 hover:bg-pxl-gold-light transition-colors"
          >
            <span className="text-3xl">📝</span>
            <div>
              <div className="font-semibold">Aanvragen Beoordelen</div>
              <div className="text-sm text-pxl-black-light">
                {stats.pendingAanvragen > 0
                  ? `${stats.pendingAanvragen} wachtend`
                  : 'Geen openstaand'}
              </div>
            </div>
          </Link>

          <Link
            href="/docent/studenten"
            className="card-flat flex items-center gap-4 hover:bg-pxl-gold-light transition-colors"
          >
            <span className="text-3xl">🎓</span>
            <div>
              <div className="font-semibold">Studenten Overzicht</div>
              <div className="text-sm text-pxl-black-light">Bekijk voortgang</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
