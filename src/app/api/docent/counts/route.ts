import { NextResponse } from 'next/server'
import { auth, getBeheerdeOpleidingIds, opleidingScopeFilter, bewijsScopeWhere } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'docent' && session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Opleidingen die deze gebruiker beoordeelt: docent gekoppeld, admin beheerd,
    // superadmin alle (null). Een lege lijst telt niets (nooit terugvallen op alles).
    const opleidingIds = await getBeheerdeOpleidingIds(session.user.id)

    const [aanvragenCount, bewijsstukkenCount] = await Promise.all([
      prisma.activiteit.count({
        where: {
          typeAanvraag: 'student',
          status: 'in_review',
          opleidingId: opleidingScopeFilter(opleidingIds),
        },
      }),
      prisma.inschrijving.count({
        where: {
          bewijsStatus: 'ingediend',
          ...bewijsScopeWhere(session.user.id, opleidingIds),
        },
      }),
    ])

    return NextResponse.json({
      aanvragen: aanvragenCount,
      bewijsstukken: bewijsstukkenCount,
    })
  } catch (error) {
    console.error('Error fetching counts:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
