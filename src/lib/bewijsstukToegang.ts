import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { getBeheerdeOpleidingIds, bewijsScopeWhere } from '@/lib/auth'

type SessieGebruiker = { id: string; role: string }

const STAFF_ROLLEN = ['docent', 'admin', 'superadmin']

// Prisma-filter op inschrijvingen waarvan een docent/admin de bewijsstukken mag zien.
// Zelfde scope als de docent-bewijsstukkenpagina (bewijsScopeWhere):
// - superadmin: alles
// - admin: activiteit (primair of via ActiviteitOpleiding) of student uit een
//   beheerde opleiding (AdminOpleiding)
// - docent: idem voor gekoppelde opleidingen (DocentOpleiding)
// - admin/docent: ook activiteiten die hij zelf aanmaakte of als aanvraag beoordeelde
// Geeft null terug voor rollen zonder staff-toegang (student).
export async function bewijsToegangWhere(
  user: SessieGebruiker
): Promise<Prisma.InschrijvingWhereInput | null> {
  if (!STAFF_ROLLEN.includes(user.role)) return null
  const opleidingIds = await getBeheerdeOpleidingIds(user.id)
  return bewijsScopeWhere(user.id, opleidingIds)
}

// Mag deze gebruiker de bewijsstukken van deze inschrijving zien?
// De student-eigenaar altijd; docent/admin enkel binnen hun opleiding(en).
// Met `alleenAdmin` (bv. verwijderen) telt een docent niet mee.
export async function magBewijsstukkenVan(
  user: SessieGebruiker,
  inschrijving: { id: string; studentId: string },
  { alleenAdmin = false }: { alleenAdmin?: boolean } = {}
): Promise<boolean> {
  if (inschrijving.studentId === user.id) return true
  if (user.role === 'superadmin') return true
  if (alleenAdmin && user.role !== 'admin') return false

  const scope = await bewijsToegangWhere(user)
  if (!scope) return false

  const match = await prisma.inschrijving.findFirst({
    where: { AND: [{ id: inschrijving.id }, scope] },
    select: { id: true },
  })
  return !!match
}
