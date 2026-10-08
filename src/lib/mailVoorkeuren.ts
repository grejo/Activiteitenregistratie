import prisma from '@/lib/prisma'

export type MailVoorkeuren = {
  role: string
  ontvangtMail: boolean
  opleidingen: { opleidingId: string; naam: string; ontvangtMail: boolean }[]
}

/**
 * Mailvoorkeuren van een staff-gebruiker. Per opleiding tellen enkel de koppelingen
 * die bij de rol horen (docent → DocentOpleiding, admin → AdminOpleiding), want
 * dat zijn de koppelingen waarop notifyNieuweAanvraag de ontvangers selecteert.
 * Superadmins ontvangen voor alle opleidingen en hebben enkel de hoofdschakelaar.
 */
export async function getMailVoorkeuren(userId: string): Promise<MailVoorkeuren | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      ontvangtMail: true,
      docentOpleidingen: {
        select: { opleidingId: true, ontvangtMail: true, opleiding: { select: { naam: true } } },
      },
      adminOpleidingen: {
        select: { opleidingId: true, ontvangtMail: true, opleiding: { select: { naam: true } } },
      },
    },
  })
  if (!user) return null

  const koppelingen =
    user.role === 'docent'
      ? user.docentOpleidingen
      : user.role === 'admin'
        ? user.adminOpleidingen
        : []

  return {
    role: user.role,
    ontvangtMail: user.ontvangtMail,
    opleidingen: koppelingen
      .map((k) => ({ opleidingId: k.opleidingId, naam: k.opleiding.naam, ontvangtMail: k.ontvangtMail }))
      .sort((a, b) => a.naam.localeCompare(b.naam)),
  }
}

/**
 * Bewaart mailvoorkeuren. Enkel bestaande koppelingen worden aangepast; met
 * `toegelatenOpleidingIds` (null = alle) beperk je welke opleidingen gewijzigd mogen worden.
 */
export async function saveMailVoorkeuren(
  userId: string,
  body: unknown,
  toegelatenOpleidingIds: string[] | null = null
): Promise<void> {
  const data = (body ?? {}) as { ontvangtMail?: unknown; opleidingen?: unknown }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (!user) return

  const ops = []
  if (typeof data.ontvangtMail === 'boolean') {
    ops.push(prisma.user.update({ where: { id: userId }, data: { ontvangtMail: data.ontvangtMail } }))
  }

  if (Array.isArray(data.opleidingen)) {
    for (const item of data.opleidingen) {
      const { opleidingId, ontvangtMail } = (item ?? {}) as { opleidingId?: unknown; ontvangtMail?: unknown }
      if (typeof opleidingId !== 'string' || typeof ontvangtMail !== 'boolean') continue
      if (toegelatenOpleidingIds && !toegelatenOpleidingIds.includes(opleidingId)) continue
      if (user.role === 'docent') {
        ops.push(
          prisma.docentOpleiding.updateMany({
            where: { docentId: userId, opleidingId },
            data: { ontvangtMail },
          })
        )
      } else if (user.role === 'admin') {
        ops.push(
          prisma.adminOpleiding.updateMany({
            where: { adminId: userId, opleidingId },
            data: { ontvangtMail },
          })
        )
      }
    }
  }

  if (ops.length > 0) await prisma.$transaction(ops)
}
