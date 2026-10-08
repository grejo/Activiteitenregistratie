'use client'

import { BEENTJES, BEENTJE_LABELS, NIVEAUS, NIVEAU_LABELS } from '@/lib/beentjes'

type OpleidingNiveaus = {
  niveau1Beschrijving?: string | null
  niveau2Beschrijving?: string | null
  niveau3Beschrijving?: string | null
  niveau4Beschrijving?: string | null
}

/**
 * Keuze van X-factor beentje + niveau bij het aanmaken/bewerken van een activiteit
 * door docent of admin. Zonder beentje telt de activiteit niet mee op de scorekaart.
 */
export default function XFactorVelden({
  beentje,
  niveau,
  opleiding,
  onChange,
}: {
  beentje: string
  niveau: string
  opleiding?: OpleidingNiveaus | null
  onChange: (veld: 'beentje' | 'niveau', waarde: string) => void
}) {
  const niveauNr = niveau ? Number(niveau) : null
  const beschrijving =
    opleiding && niveauNr
      ? (opleiding[`niveau${niveauNr}Beschrijving` as keyof OpleidingNiveaus] ?? null)
      : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="beentje" className="block text-sm font-medium text-gray-700">
          X-factor beentje *
        </label>
        <select
          id="beentje"
          name="beentje"
          required
          value={beentje}
          onChange={(e) => onChange('beentje', e.target.value)}
          className="input-field mt-1"
        >
          <option value="" disabled>— Kies een beentje —</option>
          {BEENTJES.map((b) => (
            <option key={b} value={b}>
              {BEENTJE_LABELS[b]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Binnen welk X-factor beentje telt deze activiteit?
        </p>
      </div>

      <div>
        <label
          htmlFor="niveau"
          className="flex items-center gap-1 text-sm font-medium text-gray-700"
        >
          Niveau *
          {beschrijving && (
            <span
              title={beschrijving}
              className="cursor-help text-gray-400"
              aria-label="Opleidingsspecifieke omschrijving van dit niveau"
            >
              ⓘ
            </span>
          )}
        </label>
        <select
          id="niveau"
          name="niveau"
          required
          value={niveau}
          onChange={(e) => onChange('niveau', e.target.value)}
          className="input-field mt-1"
        >
          <option value="" disabled>— Kies een niveau —</option>
          {NIVEAUS.map((n) => (
            <option key={n} value={n}>
              {NIVEAU_LABELS[n]}
            </option>
          ))}
        </select>
        {beschrijving && <p className="mt-1 text-xs text-gray-500">{beschrijving}</p>}
      </div>
    </div>
  )
}
