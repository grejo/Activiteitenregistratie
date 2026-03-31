import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getCurrentSchooljaar } from '@/lib/utils'
import { BEENTJES, BEENTJE_LABELS, NIVEAUS, getVeldNaam } from '@/lib/beentjes'

export const metadata = {
  title: 'Student Dashboard - PXL-FactorTool',
}

async function getStudentStats(userId: string, opleidingId: string | null) {
  const schooljaar = getCurrentSchooljaar()

  const [mijnInschrijvingen, mijnAanvragen, beschikbareActiviteiten, voortgang] =
    await Promise.all([
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
      prisma.studentVoortgang.findUnique({
        where: { studentId_schooljaar: { studentId: userId, schooljaar } },
      }),
    ])

  const target = opleidingId
    ? await prisma.opleidingTarget.findUnique({
        where: { opleidingId_schooljaar: { opleidingId, schooljaar } },
      })
    : null

  return {
    mijnInschrijvingen,
    mijnAanvragen,
    beschikbareActiviteiten,
    voortgang: voortgang as Record<string, number> | null,
    target: target as Record<string, number> | null,
  }
}

export default async function StudentDashboard() {
  const session = await auth()

  if (!session?.user || (session.user.role !== 'student' && session.user.role !== 'admin')) {
    redirect('/dashboard')
  }

  const stats = await getStudentStats(session.user.id, session.user.opleidingId || null)

  // Bereken totaal behaalde activiteiten op scorekaart
  const totaalBehaald = stats.voortgang
    ? BEENTJES.reduce(
        (sum, b) =>
          sum + NIVEAUS.reduce((s2, n) => s2 + (stats.voortgang?.[getVeldNaam(b, n)] ?? 0), 0),
        0
      )
    : 0

  // Bereken behaalde beentjes
  const behaaldBeentjes = BEENTJES.filter((beentje) => {
    const niveausMetTarget = NIVEAUS.filter(
      (n) => (stats.target?.[getVeldNaam(beentje, n)] ?? 0) > 0
    )
    if (niveausMetTarget.length === 0) return false
    return niveausMetTarget.every(
      (n) =>
        (stats.voortgang?.[getVeldNaam(beentje, n)] ?? 0) >=
        (stats.target?.[getVeldNaam(beentje, n)] ?? 0)
    )
  })

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

      {/* Voortgang samenvatting */}
      <div className="card-flat">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold">X-Factor Voortgang</span>
          <Link href="/student/scorekaart" className="text-sm text-pxl-gold hover:underline font-medium">
            Volledig overzicht →
          </Link>
        </div>
        {behaaldBeentjes.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {behaaldBeentjes.map((b) => (
              <span key={b} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                ✓ {BEENTJE_LABELS[b]}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-pxl-black-light mb-3">Nog geen beentjes volledig behaald.</p>
        )}
        <div className="text-sm text-pxl-black-light">
          {totaalBehaald} goedgekeurde activiteiten • {behaaldBeentjes.length} / {BEENTJES.length} beentjes
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
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-3xl font-bold text-pxl-gold">{totaalBehaald}</div>
          <div className="text-pxl-black-light">Activiteiten Behaald</div>
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
