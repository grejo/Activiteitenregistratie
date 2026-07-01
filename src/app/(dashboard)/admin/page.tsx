import { auth, getBeheerdeOpleidingIds } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Admin Dashboard - Xfactorapp',
}

async function getStats(beheerdeIds: string[] | null) {
  // Superadmin (beheerdeIds === null) ziet alles; opleidingsadmin enkel eigen opleiding(en)
  const studentWhere = beheerdeIds
    ? { role: 'student', actief: true, opleidingId: { in: beheerdeIds } }
    : { role: 'student', actief: true }
  const docentWhere = beheerdeIds
    ? { role: 'docent', actief: true, docentOpleidingen: { some: { opleidingId: { in: beheerdeIds } } } }
    : { role: 'docent', actief: true }
  const opleidingWhere = beheerdeIds ? { actief: true, id: { in: beheerdeIds } } : { actief: true }
  const activiteitWhere = beheerdeIds ? { opleidingId: { in: beheerdeIds } } : {}
  const pendingWhere = beheerdeIds
    ? { status: 'in_review', opleidingId: { in: beheerdeIds } }
    : { status: 'in_review' }

  const [
    totalStudents,
    totalDocenten,
    totalOpleidingen,
    totalActiviteiten,
    pendingAanvragen,
  ] = await Promise.all([
    prisma.user.count({ where: studentWhere }),
    prisma.user.count({ where: docentWhere }),
    prisma.opleiding.count({ where: opleidingWhere }),
    prisma.activiteit.count({ where: activiteitWhere }),
    prisma.activiteit.count({ where: pendingWhere }),
  ])

  // Voor superadmin: globaal gebruikersaantal; voor opleidingsadmin: studenten + docenten in scope
  const totalUsers = beheerdeIds
    ? totalStudents + totalDocenten
    : await prisma.user.count({ where: { actief: true } })

  return {
    totalUsers,
    totalStudents,
    totalDocenten,
    totalOpleidingen,
    totalActiviteiten,
    pendingAanvragen,
  }
}

export default async function AdminDashboard() {
  const session = await auth()

  if (session?.user.role !== 'admin' && session?.user.role !== 'superadmin') {
    redirect('/dashboard')
  }

  const beheerdeIds = await getBeheerdeOpleidingIds(session.user.id)
  const stats = await getStats(beheerdeIds)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Admin Dashboard
        </h1>
        <p className="text-pxl-black-light mt-4">
          Welkom, {session.user.naam}. Beheer gebruikers, opleidingen en activiteiten.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-3xl font-bold text-pxl-gold">{stats.totalUsers}</div>
          <div className="text-pxl-black-light">Totaal Gebruikers</div>
          <div className="text-sm text-gray-500 mt-2">
            {stats.totalStudents} studenten, {stats.totalDocenten} docenten
          </div>
        </div>

        <div className="card">
          <div className="text-4xl mb-2">🎓</div>
          <div className="text-3xl font-bold text-pxl-gold">{stats.totalOpleidingen}</div>
          <div className="text-pxl-black-light">Opleidingen</div>
        </div>

        <div className="card">
          <div className="text-4xl mb-2">📅</div>
          <div className="text-3xl font-bold text-pxl-gold">{stats.totalActiviteiten}</div>
          <div className="text-pxl-black-light">Activiteiten</div>
        </div>

        {stats.pendingAanvragen > 0 && (
          <div className="card border-t-yellow-500">
            <div className="text-4xl mb-2">⏳</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingAanvragen}</div>
            <div className="text-pxl-black-light">Wachtende Aanvragen</div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-heading font-bold text-xl mb-4">Snelle Acties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/users"
            className="card-flat flex items-center gap-4 hover:bg-pxl-gold-light transition-colors"
          >
            <span className="text-3xl">👤</span>
            <div>
              <div className="font-semibold">Gebruikersbeheer</div>
              <div className="text-sm text-pxl-black-light">Beheer alle gebruikers</div>
            </div>
          </Link>

          <Link
            href="/admin/opleidingen"
            className="card-flat flex items-center gap-4 hover:bg-pxl-gold-light transition-colors"
          >
            <span className="text-3xl">🏫</span>
            <div>
              <div className="font-semibold">Opleidingen</div>
              <div className="text-sm text-pxl-black-light">Beheer opleidingen</div>
            </div>
          </Link>

          <Link
            href="/admin/activiteiten"
            className="card-flat flex items-center gap-4 hover:bg-pxl-gold-light transition-colors"
          >
            <span className="text-3xl">📋</span>
            <div>
              <div className="font-semibold">Alle Activiteiten</div>
              <div className="text-sm text-pxl-black-light">Overzicht activiteiten</div>
            </div>
          </Link>

          <Link
            href="/admin/users/new"
            className="card-flat flex items-center gap-4 hover:bg-pxl-gold-light transition-colors"
          >
            <span className="text-3xl">➕</span>
            <div>
              <div className="font-semibold">Nieuwe Gebruiker</div>
              <div className="text-sm text-pxl-black-light">Maak een account aan</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
