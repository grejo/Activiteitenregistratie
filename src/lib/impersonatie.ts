import { cookies } from 'next/headers'
import { readSignedPayload, signPayload } from '@/lib/demo'

// "Inloggen als": een superadmin bekijkt en gebruikt de app als een andere
// gebruiker, om problemen te kunnen nakijken. Werkt zoals de demo-modus: een
// gesigneerde cookie overschrijft de identiteit in de session-callback; de
// echte JWT van de superadmin blijft ongemoeid.

export const IMPERSONATIE_COOKIE = 'xfactor_als'
export const IMPERSONATIE_MAX_AGE = 2 * 60 * 60 // 2 uur

export type ImpersonatiePayload = {
  originalUserId: string
  targetUserId: string
  logId: string
  iat: number
}

export function signImpersonatie(payload: ImpersonatiePayload): Promise<string> {
  return signPayload(payload)
}

export async function verifyImpersonatieCookie(
  raw: string | undefined | null
): Promise<ImpersonatiePayload | null> {
  const p = (await readSignedPayload(raw)) as Partial<ImpersonatiePayload> | null
  if (
    !p ||
    typeof p.originalUserId !== 'string' ||
    typeof p.targetUserId !== 'string' ||
    typeof p.logId !== 'string' ||
    typeof p.iat !== 'number'
  ) {
    return null
  }
  if (Date.now() / 1000 - p.iat > IMPERSONATIE_MAX_AGE) return null
  return p as ImpersonatiePayload
}

// Server-only: lees en verifieer de impersonatie-cookie uit de huidige request.
export async function readImpersonatieCookie(): Promise<ImpersonatiePayload | null> {
  const store = await cookies()
  return verifyImpersonatieCookie(store.get(IMPERSONATIE_COOKIE)?.value)
}

// Beëindig een lopende overname: cookie wissen en de log afsluiten.
// Gebruikt door "Terug naar mijn account" en bij uitloggen.
export async function beeindigImpersonatie(): Promise<void> {
  const huidig = await readImpersonatieCookie()
  const store = await cookies()
  store.delete(IMPERSONATIE_COOKIE)
  if (huidig) {
    const { default: prisma } = await import('@/lib/prisma')
    await prisma.impersonationLog
      .update({ where: { id: huidig.logId }, data: { endedAt: new Date() } })
      .catch(() => {
        /* log kan ontbreken — negeer */
      })
  }
}
