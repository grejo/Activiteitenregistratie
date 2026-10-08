'use client'

import { useState } from 'react'
import type { MailVoorkeuren } from '@/lib/mailVoorkeuren'

/**
 * Schakelaars voor systeemmails aan staff: een hoofdschakelaar en per gekoppelde
 * opleiding "mail bij nieuwe studentaanvraag". Wordt gebruikt op /mailmeldingen
 * (eigen voorkeuren) en in het admin-gebruikersbeheer (endpoint per gebruiker).
 */
export default function MailVoorkeurenForm({
  initieel,
  endpoint,
  eigen = true,
}: {
  initieel: MailVoorkeuren
  endpoint: string
  eigen?: boolean
}) {
  const [ontvangtMail, setOntvangtMail] = useState(initieel.ontvangtMail)
  const [opleidingen, setOpleidingen] = useState(initieel.opleidingen)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  const opslaan = async () => {
    setBezig(true)
    setMelding(null)
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ontvangtMail,
          opleidingen: opleidingen.map((o) => ({ opleidingId: o.opleidingId, ontvangtMail: o.ontvangtMail })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Opslaan mislukt')
      setOntvangtMail(data.ontvangtMail)
      setOpleidingen(data.opleidingen)
      setMelding({ ok: true, tekst: 'Mailvoorkeuren opgeslagen.' })
    } catch (err) {
      setMelding({ ok: false, tekst: err instanceof Error ? err.message : 'Opslaan mislukt' })
    } finally {
      setBezig(false)
    }
  }

  const jij = eigen ? 'je' : 'deze gebruiker'

  return (
    <div className="space-y-4">
      {melding && (
        <div
          className={`px-4 py-3 rounded border text-sm ${
            melding.ok
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {melding.tekst}
        </div>
      )}

      <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 bg-gray-50 p-4">
        <input
          type="checkbox"
          checked={ontvangtMail}
          onChange={(e) => setOntvangtMail(e.target.checked)}
          className="mt-0.5 h-4 w-4 text-pxl-gold focus:ring-pxl-gold border-gray-300 rounded"
        />
        <span className="text-sm text-gray-700">
          <span className="font-medium">Systeemmails ontvangen</span>
          <br />
          Hoofdschakelaar. Staat dit uit, dan krijgt {jij} geen enkele mail van de X-FactorApp
          over nieuwe studentaanvragen.
        </span>
      </label>

      {initieel.role === 'superadmin' ? (
        <p className="text-sm text-gray-500">
          Als superadmin ontvang {eigen ? 'je' : 'deze gebruiker'} meldingen voor alle opleidingen; enkel
          de hoofdschakelaar is van toepassing.
        </p>
      ) : opleidingen.length === 0 ? (
        <p className="text-sm text-gray-500">
          {eigen ? 'Je bent' : 'Deze gebruiker is'} nog niet aan een opleiding gekoppeld.
        </p>
      ) : (
        <div className={ontvangtMail ? '' : 'opacity-50'}>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Mail bij een nieuwe studentaanvraag, per opleiding:
          </p>
          <div className="space-y-1 border border-gray-200 rounded p-2">
            {opleidingen.map((o) => (
              <label key={o.opleidingId} className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={o.ontvangtMail}
                  disabled={!ontvangtMail}
                  onChange={(e) =>
                    setOpleidingen((prev) =>
                      prev.map((x) =>
                        x.opleidingId === o.opleidingId ? { ...x, ontvangtMail: e.target.checked } : x
                      )
                    )
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{o.naam}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <button type="button" onClick={opslaan} disabled={bezig} className="btn-primary">
        {bezig ? 'Bezig...' : 'Mailvoorkeuren opslaan'}
      </button>
    </div>
  )
}
