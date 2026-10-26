import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth, getBeheerdeOpleidingIds, opleidingScopeFilter } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { DEMO_OPLEIDING_CODE } from '@/lib/demo'

export const metadata = { title: 'Info opleiding' }

// Algemene info over het OLOD, per opleiding ingevuld door de opleidingsadmin.
// Student: eigen opleiding. Docent/admin: gekoppelde opleidingen. Superadmin: alle.
export default async function InfoOpleidingPage() {
  const session = await auth()
  if (!session?.user) redirect('/dashboard')

  const role = session.user.role
  const opleidingIds = await getBeheerdeOpleidingIds(session.user.id)
  const kanBewerken = role === 'admin' || role === 'superadmin'

  const opleidingen =
    opleidingIds !== null && opleidingIds.length === 0
      ? []
      : await prisma.opleiding.findMany({
          where: {
            id: opleidingScopeFilter(opleidingIds),
            // Superadmin: enkel opleidingen waar effectief info voor is ingevuld
            ...(opleidingIds === null
              ? {
                  code: { not: DEMO_OPLEIDING_CODE },
                  OR: [{ infoTekst: { not: null } }, { infoLink: { not: null } }],
                }
              : {}),
          },
          select: { id: true, naam: true, infoTekst: true, infoLink: true },
          orderBy: { naam: 'asc' },
        })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Info opleiding
        </h1>
        <p className="text-pxl-black-light mt-4">
          Algemene informatie over het OLOD en de werking van de X-Factor binnen je opleiding.
        </p>
      </div>

      {opleidingen.length === 0 ? (
        <div className="card max-w-3xl text-gray-600">
          {role === 'student'
            ? 'Je bent nog niet gekoppeld aan een opleiding. Neem contact op met je opleiding als dit zo blijft.'
            : 'Er is nog geen info beschikbaar voor jouw opleiding(en).'}
        </div>
      ) : (
        opleidingen.map((o) => (
          <section key={o.id} className="card max-w-3xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-heading font-bold text-xl text-pxl-black">{o.naam}</h2>
              {kanBewerken && (
                <Link
                  href={`/admin/opleidingen/${o.id}`}
                  className="text-sm text-pxl-gold hover:underline whitespace-nowrap"
                >
                  Bewerken
                </Link>
              )}
            </div>

            {o.infoTekst ? (
              <p className="text-gray-700 whitespace-pre-wrap">{o.infoTekst}</p>
            ) : (
              <p className="text-gray-500 italic">Nog geen info beschikbaar.</p>
            )}

            {o.infoLink && (
              <a
                href={o.infoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-pxl-gold text-white rounded hover:bg-pxl-gold-hover font-medium transition-colors"
              >
                Meer info ↗
              </a>
            )}
          </section>
        ))
      )}
    </div>
  )
}
