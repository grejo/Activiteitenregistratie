'use client'

import { useState } from 'react'
import type { LogboekImportResultaat } from '@/lib/opleidingSso'

type Resultaat = LogboekImportResultaat & { toegepast: boolean }

export default function LogboekImport({ onKlaar }: { onKlaar: () => void }) {
  const [bestanden, setBestanden] = useState<File[]>([])
  const [resultaat, setResultaat] = useState<Resultaat | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function verstuur(toepassen: boolean) {
    if (bestanden.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      bestanden.forEach((f) => formData.append('files', f))
      formData.append('toepassen', String(toepassen))
      const res = await fetch('/api/admin/opleidingen/sso-sync/logboek', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verwerken mislukt')
      setResultaat(data)
      if (toepassen) {
        setBestanden([])
        onKlaar()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er is iets misgegaan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-t pt-4 space-y-3">
      <div>
        <h3 className="font-heading font-bold text-lg text-pxl-black">Aanvullen vanuit het logboek</h3>
        <p className="text-sm text-pxl-black-light max-w-3xl">
          Bij elke login schrijft de server een regel{' '}
          <code className="text-xs">[AUTH] resolved email: … | department: …</code> weg. Upload de
          serverlogs (Azure Portal → App Service → <em>Advanced Tools (Kudu)</em> →{' '}
          <em>LogFiles</em>, of een export uit Log stream / Application Insights) om de
          opleidingscode van studenten die vroeger al ingelogd hebben aan te vullen. Je kunt
          meerdere bestanden tegelijk kiezen (uitgepakte .log/.txt/.csv).
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <input
          type="file"
          multiple
          accept=".log,.txt,.csv,text/plain"
          onChange={(e) => {
            setBestanden(Array.from(e.target.files ?? []))
            setResultaat(null)
          }}
          className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-pxl-gold file:text-white hover:file:bg-yellow-600 cursor-pointer"
        />
        <button
          onClick={() => verstuur(false)}
          disabled={bestanden.length === 0 || loading}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && !resultaat ? 'Bezig met analyseren…' : 'Analyseer logboek'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
      )}

      {resultaat && (
        <div className="space-y-3 text-sm">
          <p className={resultaat.toegepast ? 'text-green-700 font-medium' : 'text-pxl-black'}>
            {resultaat.toegepast ? 'Toegepast: ' : 'Voorstel: '}
            {resultaat.gevonden} gebruiker(s) met een opleidingscode in het logboek ·{' '}
            <strong>{resultaat.bijgewerkt}</strong> code(s) {resultaat.toegepast ? 'aangevuld' : 'aan te vullen'} ·{' '}
            {resultaat.alGekend} al gekend · <strong>{resultaat.sync.gewijzigd}</strong> student(en){' '}
            {resultaat.toegepast ? 'gekoppeld' : 'te koppelen'} (waarvan {resultaat.sync.nieuwGekoppeld} zonder
            opleiding).
          </p>

          {resultaat.sync.onbekendeDepartments.length > 0 && (
            <p className="text-yellow-800">
              Codes zonder opleiding:{' '}
              {resultaat.sync.onbekendeDepartments.map((d) => `${d.department} (${d.aantal})`).join(', ')}
            </p>
          )}

          {resultaat.onbekendeGebruikers.length > 0 && (
            <details>
              <summary className="cursor-pointer text-gray-600">
                {resultaat.onbekendeGebruikers.length} e-mailadres(sen) uit het logboek niet gevonden in de database
              </summary>
              <ul className="mt-2 text-xs text-gray-600 font-mono max-h-40 overflow-y-auto">
                {resultaat.onbekendeGebruikers.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </details>
          )}

          {!resultaat.toegepast && (
            <button
              onClick={() => verstuur(true)}
              disabled={loading || resultaat.bijgewerkt === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Bezig…' : `Aanvullen en koppelen (${resultaat.bijgewerkt})`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
