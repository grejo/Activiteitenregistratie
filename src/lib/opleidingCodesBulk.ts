// Hulpfuncties voor het in bulk bijwerken van opleidingscodes (SSO department-codes)
// vanuit een Excel-overzicht, bv. "overzicht olods Green en Tech.xlsx".

export type BulkActie = 'primair' | 'extra' | 'nieuw' | 'overslaan'

export type BulkStatus = 'correct' | 'voorstel' | 'geen-match'

export type ExcelOpleidingRij = {
  code: string
  naam: string
}

export type BestaandeOpleiding = {
  id: string
  naam: string
  code: string
  codes: { code: string }[]
}

export type BulkVoorstel = ExcelOpleidingRij & {
  status: BulkStatus
  actie: BulkActie
  opleidingId: string | null
  toelichting: string
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const AFSTAND = /^afstandstraject\s+/

// Kern van een opleidingsnaam, zonder generieke prefixen zoals
// "professionele bachelor in de" of "afstandstraject".
function kernNaam(naam: string): string {
  return norm(naam)
    .replace(AFSTAND, '')
    .replace(/^(professionele\s+)?bachelor\s+(in\s+)?((de|het)\s+)?/, '')
    .replace(/^pba\s+/, '')
    .trim()
}

const isGraduaat = (naam: string) => /\bgraduaat\b/.test(norm(naam))

/**
 * Leest de opleidingen uit een sheet (array van rijen). Zoekt zelf de header-rij
 * met een kolom voor de opleidingscode en een kolom voor de opleidingsnaam.
 * Werkt met het OLOD-overzicht (kolommen "opleiding (opleiding)" en
 * "opleiding code (opleiding)") én met een eenvoudige lijst "Opleiding" / "Code".
 * Dubbele codes (één rij per OLOD) worden samengevoegd.
 */
export function leesOpleidingenUitRijen(rijen: unknown[][]): ExcelOpleidingRij[] {
  for (let h = 0; h < Math.min(rijen.length, 20); h++) {
    const headers = (rijen[h] || []).map((c) => norm(String(c ?? '')))
    let codeKol = headers.findIndex((x) => x.includes('opleiding') && x.includes('code'))
    if (codeKol < 0) codeKol = headers.findIndex((x) => x === 'code' || x === 'opleidingscode')
    const naamKol = headers.findIndex(
      (x, i) => i !== codeKol && /^(opleiding|opleidingsnaam|naam)\b/.test(x) && !x.includes('code')
    )
    if (codeKol < 0 || naamKol < 0) continue

    const perCode = new Map<string, ExcelOpleidingRij>()
    for (const rij of rijen.slice(h + 1)) {
      const code = String(rij?.[codeKol] ?? '').trim()
      const naam = String(rij?.[naamKol] ?? '').trim()
      if (!code || !naam) continue
      const key = code.toUpperCase()
      if (!perCode.has(key)) perCode.set(key, { code, naam })
    }
    return [...perCode.values()].sort((a, b) => a.naam.localeCompare(b.naam, 'nl'))
  }
  throw new Error(
    'Geen kolommen gevonden voor opleidingsnaam en opleidingscode. Verwacht bv. "Opleiding" en "Code".'
  )
}

/**
 * Bepaalt per Excel-rij wat er met de code moet gebeuren:
 * - code staat al (primair of extra) bij een opleiding → correct, niets doen
 * - afstandstraject waarvan de reguliere opleiding bestaat → extra code
 * - naam komt overeen met een bestaande opleiding → primaire code instellen
 * - anders → geen match, beheerder kiest zelf
 */
export function maakVoorstellen(
  rijen: ExcelOpleidingRij[],
  opleidingen: BestaandeOpleiding[]
): BulkVoorstel[] {
  return rijen.map((rij) => {
    const codeLc = rij.code.toLowerCase()

    const viaPrimair = opleidingen.find((o) => o.code.toLowerCase() === codeLc)
    if (viaPrimair) {
      return {
        ...rij,
        status: 'correct',
        actie: 'overslaan',
        opleidingId: viaPrimair.id,
        toelichting: `Al de primaire code van "${viaPrimair.naam}"`,
      }
    }
    const viaExtra = opleidingen.find((o) => o.codes.some((c) => c.code.toLowerCase() === codeLc))
    if (viaExtra) {
      return {
        ...rij,
        status: 'correct',
        actie: 'overslaan',
        opleidingId: viaExtra.id,
        toelichting: `Al een extra code van "${viaExtra.naam}"`,
      }
    }

    const volledig = opleidingen.filter((o) => norm(o.naam) === norm(rij.naam))
    if (volledig.length === 1) {
      return voorstel(rij, 'primair', volledig[0], 'Naam komt exact overeen')
    }

    const kern = kernNaam(rij.naam)
    const graduaat = isGraduaat(rij.naam)
    const kandidaten = opleidingen.filter(
      (o) => kernNaam(o.naam) === kern && isGraduaat(o.naam) === graduaat
    )
    const afstand = AFSTAND.test(norm(rij.naam))

    if (afstand) {
      // Afstandstraject: koppel als extra code aan de reguliere opleiding
      const regulier = kandidaten.filter((o) => !AFSTAND.test(norm(o.naam)))
      if (regulier.length === 1) {
        return voorstel(rij, 'extra', regulier[0], 'Afstandstraject van deze opleiding')
      }
    } else if (kandidaten.length === 1) {
      return voorstel(rij, 'primair', kandidaten[0], 'Naam komt overeen')
    }

    return {
      ...rij,
      status: 'geen-match',
      actie: 'overslaan',
      opleidingId: null,
      toelichting: 'Geen overeenkomstige opleiding gevonden',
    }
  })
}

function voorstel(
  rij: ExcelOpleidingRij,
  actie: BulkActie,
  o: BestaandeOpleiding,
  reden: string
): BulkVoorstel {
  const huidig = actie === 'primair' ? ` (huidige code: ${o.code})` : ''
  return { ...rij, status: 'voorstel', actie, opleidingId: o.id, toelichting: `${reden}${huidig}` }
}
