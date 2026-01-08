import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getCurrentSchooljaar } from '@/lib/utils'

export const metadata = {
  title: 'Student Dashboard - Activiteitenregistratie',
}

async function getStudentStats(userId: string, opleidingId: string | null) {
  const schooljaar = getCurrentSchooljaar()

  const [
    mijnInschrijvingen,
    mijnAanvragen,
    beschikbareActiviteiten,
    urenVoortgang,
  ] = await Promise.all([
    prisma.inschrijving.count({
      where: {
        studentId: userId,
        inschrijvingsstatus: 'ingeschreven',
      },
    }),
    prisma.activiteit.count({
      where: {
        aangemaaktDoorId: userId,
        typeAanvraag: 'student',
      },
    }),
    prisma.activiteit.count({
      where: {
        status: 'gepubliceerd',
        typeAanvraag: 'docent',
        opleidingId: opleidingId,
        datum: { gte: new Date() },
      },
    }),
    prisma.studentUrenVoortgang.findUnique({
      where: {
        studentId_schooljaar: {
          studentId: userId,
          schooljaar,
        },
      },
    }),
  ])

  // Haal uren targets op
  let urenTargets = null
  if (opleidingId) {
    urenTargets = await prisma.opleidingUrenTarget.findUnique({
      where: {
        opleidingId_schooljaar: {
          opleidingId,
          schooljaar,
        },
      },
    })
  }

  return {
    mijnInschrijvingen,
    mijnAanvragen,
    beschikbareActiviteiten,
    urenVoortgang,
    urenTargets,
  }
}

export default async function StudentDashboard() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'student' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  const stats = await getStudentStats(session.user.id, session.user.opleidingId || null)

  // Bereken totale uren
  const totaalUren =
    (stats.urenVoortgang?.urenNiveau1 || 0) +
    (stats.urenVoortgang?.urenNiveau2 || 0) +
    (stats.urenVoortgang?.urenNiveau3 || 0) +
    (stats.urenVoortgang?.urenNiveau4 || 0)

  const totaalTarget =
    (stats.urenTargets?.urenNiveau1 || 0) +
    (stats.urenTargets?.urenNiveau2 || 0) +
    (stats.urenTargets?.urenNiveau3 || 0) +
    (stats.urenTargets?.urenNiveau4 || 0)

  const voortgangPercentage = totaalTarget > 0 ? Math.round((totaalUren / totaalTarget) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Student Dashboard
        </h1>
        <p className="text-pxl-black-light mt-4">
          Welkom, {session.user.naam}. Bekijk activiteiten en volg je voortgang.
        </p>
        {session.user.opleidingNaam && (
          <span className="inline-block mt-2 px-3 py-1 bg-pxl-gold-light text-pxl-black rounded-full text-sm font-medium">
            {session.user.opleidingNaam}
          </span>
        )}
      </div>

      {/* Voortgang Balk */}
      <div className="card-flat">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Totale Voortgang</span>
          <span className="text-pxl-gold font-bold">{voortgangPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              voortgangPercentage >= 100 ? 'bg-green-500' : 'bg-pxl-gold'
            }`}
            style={{ width: `${Math.min(voortgangPercentage, 100)}%` }}
          />
        </div>
        <div className="text-sm text-pxl-black-light mt-2">
          {totaalUren.toFixed(1)} van {totaalTarget.toFixed(1)} uren behaald
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="text-4xl mb-2">📅</div>
          <div className="text-3xl font-bold text-pxl-gold">{stats.beschikbareActiviteiten}</div>
          <div className="text-pxl-black-light">Beschikbare Activiteiten</div>
        </div>

        <div className="card">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-3xl font-bold text-pxl-gold">{stats.mijnInschrijvingen}</div>
          <div className="text-pxl-black-light">Mijn Inschrijvingen</div>
        </div>

        <div className="card">
          <div className="text-4xl mb-2">📝</div>
          <div className="text-3xl font-bold text-pxl-gold">{stats.mijnAanvragen}</div>
          <div className="text-pxl-black-light">Mijn Aanvragen</div>
        </div>

        <div className="card">
          <div className="text-4xl mb-2">⏱️</div>
          <div className="text-3xl font-bold text-pxl-gold">{totaalUren.toFixed(1)}</div>
          <div className="text-pxl-black-light">Uren Behaald</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-heading font-bold text-xl mb-4">Snelle Acties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/student/prikbord"
            className="card-flat flex items-center gap-4 hover:bg-pxl-gold-light transition-colors"
          >
            <span className="text-3xl">📋</span>
            <div>
              <div className="font-semibold">Prikbord</div>
              <div className="text-sm text-pxl-black-light">Bekijk activiteiten</div>
            </div>
          </Link>

          <Link
            href="/student/inschrijvingen"
            className="card-flat flex items-center gap-4 hover:bg-pxl-gold-light transition-colors"
          >
            <span className="text-3xl">📅</span>
            <div>
              <div className="font-semibold">Mijn Inschrijvingen</div>
              <div className="text-sm text-pxl-black-light">Beheer je inschrijvingen</div>
            </div>
          </Link>

          <Link
            href="/student/aanvragen/new"
            className="card-flat flex items-center gap-4 hover:bg-pxl-gold-light transition-colors"
          >
            <span className="text-3xl">➕</span>
            <div>
              <div className="font-semibold">Activiteit Aanvragen</div>
              <div className="text-sm text-pxl-black-light">Vraag eigen activiteit aan</div>
            </div>
          </Link>

          <Link
            href="/student/scorekaart"
            className="card-flat flex items-center gap-4 hover:bg-pxl-gold-light transition-colors"
          >
            <span className="text-3xl">📊</span>
            <div>
              <div className="font-semibold">Scorekaart</div>
              <div className="text-sm text-pxl-black-light">Bekijk je voortgang</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
