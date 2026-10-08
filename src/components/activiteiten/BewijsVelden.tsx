'use client'

export type SjabloonOptie = {
  id: string
  naam: string
  opleidingId: string
  bestandsnaam?: string | null
}

/**
 * Laat docent/admin per activiteit communiceren welk bewijs gevraagd wordt
 * wanneer dat afwijkt van (of bovenop) het standaard aanwezigheidsattest,
 * en optioneel een sjabloon van de opleiding meegeven.
 */
export default function BewijsVelden({
  bewijsInstructie,
  onInstructieChange,
  sjablonen,
  opleidingIds,
  sjabloonIds,
  onSjabloonIdsChange,
}: {
  bewijsInstructie: string
  onInstructieChange: (waarde: string) => void
  sjablonen: SjabloonOptie[]
  opleidingIds: string[]
  sjabloonIds: string[]
  onSjabloonIdsChange: (ids: string[]) => void
}) {
  // Enkel sjablonen van de gekozen opleiding(en); reeds gekoppelde blijven zichtbaar.
  const beschikbaar = sjablonen.filter(
    (s) => opleidingIds.includes(s.opleidingId) || sjabloonIds.includes(s.id)
  )
  const toggle = (id: string) =>
    onSjabloonIdsChange(
      sjabloonIds.includes(id) ? sjabloonIds.filter((x) => x !== id) : [...sjabloonIds, id]
    )

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="bewijsInstructie" className="block text-sm font-medium text-gray-700">
          Gevraagd bewijs (optioneel)
        </label>
        <textarea
          id="bewijsInstructie"
          name="bewijsInstructie"
          value={bewijsInstructie}
          onChange={(e) => onInstructieChange(e.target.value)}
          className="input-field mt-1"
          rows={3}
          placeholder="Bv. foto van je poster, reflectieverslag van 1 A4, certificaat van de organisator…"
        />
        <p className="mt-1 text-xs text-gray-500">
          Vul in als je ander of extra bewijs verwacht dan het standaard aanwezigheidsattest.
          Studenten zien dit bij de activiteit en bij het opladen van hun bewijs.
        </p>
      </div>

      {beschikbaar.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700">Sjabloon meegeven (optioneel)</p>
          <p className="text-xs text-gray-500 mb-2">
            Studenten kunnen het aangevinkte sjabloon downloaden en ingevuld opladen als bewijs.
          </p>
          <div className="space-y-1 border border-gray-200 rounded p-2 max-h-40 overflow-y-auto bg-white">
            {beschikbaar.map((s) => (
              <label key={s.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sjabloonIds.includes(s.id)}
                  onChange={() => toggle(s.id)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">
                  {s.naam}
                  {s.bestandsnaam && (
                    <span className="text-xs text-gray-400"> ({s.bestandsnaam})</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
