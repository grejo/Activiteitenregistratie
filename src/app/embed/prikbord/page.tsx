import { headers } from 'next/headers'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Prikbord — Xfactorapp (embed)',
}

// Altijd live renderen — anders cached Next.js de "0 activiteiten"-lege staat en
// blijft die dagen zichtbaar in Blackboard.
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Publieke embed van het activiteitenprikbord voor Blackboard.
// Read-only, geen auth, geen inschrijfknop.
// - Met ?opleidingId=<uuid>  → activiteiten voor die specifieke opleiding.
// - Zonder query-param       → alle gepubliceerde activiteiten (departementaal prikbord).
export default async function EmbedPrikbordPage({
  searchParams,
}: {
  searchParams: Promise<{ opleidingId?: string }>
}) {
  const { opleidingId } = await searchParams

  // Bouw een absolute basis-URL voor de klikbare activiteit-links.
  // Voor de embed in Blackboard willen we een link *terug* naar de eigen app,
  // niet naar de embed-URL zelf.
  const hdrs = await headers()
  const proto = hdrs.get('x-forwarded-proto') ?? 'http'
  const host = hdrs.get('host') ?? 'localhost:3000'
  const baseUrl = `${proto}://${host}`

  let opleidingNaam: string | null = null
  if (opleidingId) {
    const opleiding = await prisma.opleiding.findUnique({
      where: { id: opleidingId },
      select: { naam: true, actief: true },
    })
    if (!opleiding || !opleiding.actief) {
      return (
        <div className="p-6 text-sm text-gray-600">
          Opleiding niet gevonden of niet actief.
        </div>
      )
    }
    opleidingNaam = opleiding.naam
  }

  const activiteiten = await prisma.activiteit.findMany({
    where: {
      status: 'gepubliceerd',
      datum: { gte: new Date() },
      ...(opleidingId
        ? {
            OR: [
              { opleidingId },
              { opleidingen: { some: { opleidingId } } },
            ],
          }
        : {}),
    },
    include: { opleiding: { select: { naam: true } } },
    orderBy: { datum: 'asc' },
    take: 50,
  })

  const heading = opleidingNaam
    ? `Prikbord — ${opleidingNaam}`
    : 'Prikbord — alle opleidingen'
  const emptyMessage = opleidingNaam
    ? 'Nog geen geplande activiteiten voor deze opleiding.'
    : 'Nog geen geplande activiteiten.'

  return (
    <div className="p-4 text-pxl-black font-sans">
      <div className="mb-4 pb-2 border-b border-pxl-gold">
        <h1 className="text-xl font-black text-pxl-black">{heading}</h1>
        <p className="text-xs text-gray-500">
          Aankomende activiteiten. Meld je aan in Xfactorapp om in te schrijven.
        </p>
      </div>

      {activiteiten.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {activiteiten.map((a) => {
            const detailUrl = `${baseUrl}/student/prikbord?activiteit=${a.id}`
            return (
              <li key={a.id}>
                <a
                  href={detailUrl}
                  target="_top"
                  rel="noopener"
                  className="block border border-gray-200 rounded p-3 bg-white hover:border-pxl-gold hover:bg-yellow-50 transition-colors no-underline text-inherit"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="font-semibold">
                        {a.titel}
                        {a.verplicht && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-pxl-gold text-white">
                            VERPLICHT
                          </span>
                        )}
                        {!opleidingNaam && a.opleiding && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-700">
                            {a.opleiding.naam}
                          </span>
                        )}
                      </div>
                      {a.omschrijving && (
                        <div className="text-xs text-gray-600 mt-1">{a.omschrijving}</div>
                      )}
                      <div className="text-xs text-pxl-gold mt-2 font-medium">
                        Meer informatie & inschrijven →
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                      <div>
                        {new Date(a.datum).toLocaleDateString('nl-BE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div>
                        {a.startuur} – {a.einduur}
                      </div>
                      {a.locatie && <div>{a.locatie}</div>}
                    </div>
                  </div>
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
