/**
 * De 17 duurzame ontwikkelingsdoelstellingen (SDG's) van de Verenigde Naties,
 * in de officiële Nederlandstalige naamgeving (zie sdgs.be). Elke opleiding
 * krijgt deze volledige lijst als duurzaamheidsthema's, zodat de dropdown bij
 * het aanmaken van een activiteit alle 17 SDG's toont in plaats van een
 * onvolledige, handmatig samengestelde selectie.
 */

import type { Prisma, PrismaClient } from '@prisma/client'

export type SdgDefinitie = {
  nummer: number
  naam: string
  icoon: string
}

export const SDGS: SdgDefinitie[] = [
  { nummer: 1, naam: 'Geen armoede', icoon: '🚫' },
  { nummer: 2, naam: 'Geen honger', icoon: '🌾' },
  { nummer: 3, naam: 'Goede gezondheid en welzijn', icoon: '❤️' },
  { nummer: 4, naam: 'Kwaliteitsonderwijs', icoon: '📚' },
  { nummer: 5, naam: 'Gendergelijkheid', icoon: '⚧️' },
  { nummer: 6, naam: 'Schoon water en sanitair', icoon: '💧' },
  { nummer: 7, naam: 'Betaalbare en duurzame energie', icoon: '⚡' },
  { nummer: 8, naam: 'Waardig werk en economische groei', icoon: '📈' },
  { nummer: 9, naam: 'Industrie, innovatie en infrastructuur', icoon: '🏭' },
  { nummer: 10, naam: 'Ongelijkheid verminderen', icoon: '⚖️' },
  { nummer: 11, naam: 'Duurzame steden en gemeenschappen', icoon: '🏙️' },
  { nummer: 12, naam: 'Verantwoorde consumptie en productie', icoon: '♻️' },
  { nummer: 13, naam: 'Klimaatactie', icoon: '🌍' },
  { nummer: 14, naam: 'Leven in het water', icoon: '🐟' },
  { nummer: 15, naam: 'Leven op het land', icoon: '🌳' },
  { nummer: 16, naam: 'Vrede, justitie en sterke publieke diensten', icoon: '🕊️' },
  { nummer: 17, naam: 'Partnerschap om doelstellingen te bereiken', icoon: '🤝' },
]

/** Volledige, officiële naam zoals opgeslagen in `DuurzaamheidsThema.naam`. */
export function sdgNaam(sdg: SdgDefinitie): string {
  return `SDG ${sdg.nummer} - ${sdg.naam}`
}

type Db = PrismaClient | Prisma.TransactionClient

/**
 * Maakt voor de opgegeven opleiding elk van de 17 SDG's aan als
 * duurzaamheidsthema, tenzij er al een thema bestaat dat met "SDG <n>"
 * begint. Idempotent: kan gerust herhaald worden zonder duplicaten.
 */
export async function maakSdgThemas(db: Db, opleidingId: string): Promise<void> {
  const bestaande = await db.duurzaamheidsThema.findMany({
    where: { opleidingId },
    select: { naam: true },
  })
  const bestaandeSdgNummers = new Set(
    bestaande
      .map((t) => t.naam.match(/^SDG\s+(\d+)\b/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => Number(m[1]))
  )

  const ontbrekend = SDGS.filter((sdg) => !bestaandeSdgNummers.has(sdg.nummer))
  if (ontbrekend.length === 0) return

  await db.duurzaamheidsThema.createMany({
    data: ontbrekend.map((sdg) => ({
      naam: sdgNaam(sdg),
      icoon: sdg.icoon,
      volgorde: sdg.nummer,
      opleidingId,
    })),
  })
}

/**
 * Geeft voor de opgegeven opleiding een map van SDG-nummer naar het id van
 * het bijhorende `DuurzaamheidsThema`. Gebruikt door seeds om activiteiten
 * aan een SDG te koppelen zonder vaste, handmatig gekozen ids.
 */
export async function sdgThemaIds(db: Db, opleidingId: string): Promise<Map<number, string>> {
  const themas = await db.duurzaamheidsThema.findMany({
    where: { opleidingId },
    select: { id: true, naam: true },
  })
  const map = new Map<number, string>()
  for (const t of themas) {
    const match = t.naam.match(/^SDG\s+(\d+)\b/)
    if (match) map.set(Number(match[1]), t.id)
  }
  return map
}
