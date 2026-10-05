'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BulkActie, BulkStatus, BulkVoorstel } from '@/lib/opleidingCodesBulk'
import type { SyncResultaat } from '@/lib/opleidingSso'
import LogboekImport from './LogboekImport'

type Opleiding = { id: string; naam: string; code: string; codes: { code: string }[] }

type Rij = BulkVoorstel & { oudeCodeBehouden: boolean }

type Resultaat = {
  primair: number
  extra: number
  nieuw: number
  log: string[]
  sync: SyncResultaat | null
}

const STATUS_LABEL: Record<BulkStatus, { tekst: string; klasse: string }> = {
  correct: { tekst: 'Al correct', klasse: 'bg-green-100 text-green-800' },
  voorstel: { tekst: 'Voorstel', klasse: 'bg-yellow-100 text-yellow-800' },
  'geen-match': { tekst: 'Geen match', klasse: 'bg-red-100 text-red-800' },
}

const ACTIE_LABEL: Record<BulkActie, string> = {
  overslaan: 'Niets doen',
  primair: 'Instellen als primaire code van…',
  extra: 'Toevoegen als extra code bij…',
  nieuw: 'Nieuwe opleiding aanmaken',
}

export default function BulkCodesModule() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [rijen, setRijen] = useState<Rij[] | null>(null)
  const [opleidingen, setOpleidingen] = useState<Opleiding[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultaat, setResultaat] = useState<Resultaat | null>(null)
  const [verbergCorrect, setVerbergCorrect] = useState(false)

  // Overzicht studentkoppelingen op basis van de laatst gekende SSO-department
  const [koppeling, setKoppeling] = useState<SyncResultaat | null>(null)
  const [koppelResultaat, setKoppelResultaat] = useState<SyncResultaat | null>(null)
  const [koppelLoading, setKoppelLoading] = useState(false)

  const laadKoppeling = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/opleidingen/sso-sync')
      if (res.ok) setKoppeling(await res.json())
    } catch {
      // overzicht is informatief; stil falen
    }
  }, [])

  useEffect(() => {
    laadKoppeling()
  }, [laadKoppeling])

  async function koppelNu() {
    setKoppelLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/opleidingen/sso-sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Koppelen mislukt')
      setKoppelResultaat(data)
      await laadKoppeling()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er is iets misgegaan')
    } finally {
      setKoppelLoading(false)
    }
  }

  async function analyseer() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResultaat(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/opleidingen/bulk-codes', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analyse mislukt')
      setOpleidingen(data.opleidingen)
      setRijen(data.voorstellen.map((v: BulkVoorstel) => ({ ...v, oudeCodeBehouden: true })))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er is iets misgegaan')
    } finally {
      setLoading(false)
    }
  }

  async function toepassen() {
    if (!rijen) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/opleidingen/bulk-codes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rijen }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Toepassen mislukt')
      setResultaat(data)
      setKoppelResultaat(null)
      await laadKoppeling()
      setRijen(null)
      setFile(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er is iets misgegaan')
    } finally {
      setLoading(false)
    }
  }

  function wijzig(index: number, patch: Partial<Rij>) {
    setRijen((huidig) => huidig && huidig.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const aantalWijzigingen = rijen?.filter((r) => r.actie !== 'overslaan').length ?? 0
  const onvolledig = rijen?.some(
    (r) => (r.actie === 'primair' || r.actie === 'extra') && !r.opleidingId
  )
  const opleidingNaam = (id: string | null) => opleidingen.find((o) => o.id === id)

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-heading font-bold text-xl text-pxl-black mb-4">1 — Bestand kiezen</h2>
        <div className="flex flex-wrap items-end gap-4">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setRijen(null)
              setResultaat(null)
            }}
            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-pxl-gold file:text-white hover:file:bg-yellow-600 cursor-pointer"
          />
          <button
            onClick={analyseer}
            disabled={!file || loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && !rijen ? 'Bezig met analyseren…' : 'Analyseer bestand'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm whitespace-pre-line">
          {error}
        </div>
      )}

      {resultaat && (
        <div className="card space-y-3">
          <h2 className="font-heading font-bold text-xl text-pxl-black">Wijzigingen toegepast</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-flat">
              <div className="text-sm text-pxl-black-light">Primaire code aangepast</div>
              <div className="text-2xl font-bold text-pxl-gold">{resultaat.primair}</div>
            </div>
            <div className="card-flat">
              <div className="text-sm text-pxl-black-light">Extra codes toegevoegd</div>
              <div className="text-2xl font-bold text-blue-600">{resultaat.extra}</div>
            </div>
            <div className="card-flat">
              <div className="text-sm text-pxl-black-light">Nieuwe opleidingen</div>
              <div className="text-2xl font-bold text-green-600">{resultaat.nieuw}</div>
            </div>
          </div>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            {resultaat.log.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
          {resultaat.sync && (
            <p className="text-sm text-pxl-black-light">
              Studenten meteen herkoppeld op basis van hun laatste login:{' '}
              <strong>{resultaat.sync.gewijzigd}</strong> gewijzigd (waarvan{' '}
              {resultaat.sync.nieuwGekoppeld} die nog geen opleiding hadden).
            </p>
          )}
        </div>
      )}

      {rijen && (
        <div className="card">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <div>
              <h2 className="font-heading font-bold text-xl text-pxl-black">2 — Voorstel nakijken</h2>
              <p className="text-sm text-pxl-black-light">
                {rijen.length} opleidingscodes gevonden ·{' '}
                {rijen.filter((r) => r.status === 'correct').length} al correct ·{' '}
                {rijen.filter((r) => r.status === 'geen-match').length} zonder match
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={verbergCorrect}
                onChange={(e) => setVerbergCorrect(e.target.checked)}
              />
              Verberg codes die al correct zijn
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Opleiding (Excel)</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actie</th>
                </tr>
              </thead>
              <tbody>
                {rijen.map((r, i) => {
                  if (verbergCorrect && r.status === 'correct') return null
                  const doel = opleidingNaam(r.opleidingId)
                  const nodigOpleiding = r.actie === 'primair' || r.actie === 'extra'
                  return (
                    <tr key={r.code} className="border-b align-top">
                      <td className="py-3 pr-4 font-mono font-semibold">{r.code}</td>
                      <td className="py-3 pr-4">{r.naam}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_LABEL[r.status].klasse}`}>
                          {STATUS_LABEL[r.status].tekst}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">{r.toelichting}</div>
                      </td>
                      <td className="py-3 pr-4 space-y-2 min-w-[18rem]">
                        <select
                          value={r.actie}
                          onChange={(e) => wijzig(i, { actie: e.target.value as BulkActie })}
                          className="input-field w-full"
                        >
                          {(Object.keys(ACTIE_LABEL) as BulkActie[]).map((a) => (
                            <option key={a} value={a}>{ACTIE_LABEL[a]}</option>
                          ))}
                        </select>
                        {nodigOpleiding && (
                          <select
                            value={r.opleidingId ?? ''}
                            onChange={(e) => wijzig(i, { opleidingId: e.target.value || null })}
                            className={`input-field w-full ${!r.opleidingId ? 'border-red-400' : ''}`}
                          >
                            <option value="">— Kies opleiding —</option>
                            {opleidingen.map((o) => (
                              <option key={o.id} value={o.id}>{o.naam} ({o.code})</option>
                            ))}
                          </select>
                        )}
                        {r.actie === 'primair' && doel && doel.code.toLowerCase() !== r.code.toLowerCase() && (
                          <label className="flex items-center gap-2 text-xs text-gray-600">
                            <input
                              type="checkbox"
                              checked={r.oudeCodeBehouden}
                              onChange={(e) => wijzig(i, { oudeCodeBehouden: e.target.checked })}
                            />
                            Oude code <span className="font-mono">{doel.code}</span> behouden als extra code
                          </label>
                        )}
                        {r.actie === 'nieuw' && (
                          <div className="text-xs text-gray-600">
                            Wordt aangemaakt als &quot;{r.naam}&quot; met code {r.code}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-6">
            <button
              onClick={toepassen}
              disabled={loading || aantalWijzigingen === 0 || onvolledig}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Bezig…' : `Wijzigingen toepassen (${aantalWijzigingen})`}
            </button>
            {onvolledig && (
              <span className="text-sm text-red-600">Kies voor elke gemarkeerde rij een opleiding.</span>
            )}
          </div>
        </div>
      )}

      <div className="card space-y-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-pxl-black">Studenten koppelen</h2>
          <p className="text-sm text-pxl-black-light mt-1 max-w-3xl">
            Bij elke SSO-login wordt de opleidingscode (department) van de student bewaard en wordt
            de student automatisch aan de bijhorende opleiding gekoppeld. Na het aanpassen van codes
            worden alle studenten met een gekende code meteen opnieuw gekoppeld.
          </p>
        </div>

        {koppeling ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-flat">
                <div className="text-sm text-pxl-black-light">Studenten</div>
                <div className="text-2xl font-bold text-pxl-gold">{koppeling.gecontroleerd}</div>
              </div>
              <div className="card-flat">
                <div className="text-sm text-pxl-black-light">Zonder opleiding</div>
                <div className="text-2xl font-bold text-red-600">{koppeling.zonderOpleiding}</div>
              </div>
              <div className="card-flat">
                <div className="text-sm text-pxl-black-light">Te herkoppelen</div>
                <div className="text-2xl font-bold text-blue-600">{koppeling.gewijzigd}</div>
              </div>
              <div className="card-flat">
                <div className="text-sm text-pxl-black-light">Code nog onbekend</div>
                <div className="text-2xl font-bold text-gray-600">{koppeling.zonderDepartment}</div>
                <div className="text-xs text-gray-500">niet in login of logboek gevonden</div>
              </div>
            </div>

            {koppeling.onbekendeDepartments.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <div className="font-medium text-yellow-900 mb-1">
                  Opleidingscodes uit logins zonder overeenkomstige opleiding
                </div>
                <p className="text-yellow-800 mb-2">
                  Voeg deze codes toe (via de bulk-upload of bij de opleiding zelf) om deze studenten
                  te kunnen koppelen.
                </p>
                <div className="flex flex-wrap gap-2">
                  {koppeling.onbekendeDepartments.map((d) => (
                    <span key={d.department} className="px-2 py-0.5 rounded bg-white border border-yellow-300 font-mono text-xs">
                      {d.department} · {d.aantal}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={koppelNu}
                disabled={koppelLoading || koppeling.gewijzigd === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {koppelLoading ? 'Bezig met koppelen…' : `Nu koppelen (${koppeling.gewijzigd})`}
              </button>
              {koppelResultaat && (
                <span className="text-sm text-green-700">
                  {koppelResultaat.gewijzigd} student(en) gekoppeld.
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">Overzicht laden…</p>
        )}

        <LogboekImport
          onKlaar={() => {
            laadKoppeling()
            router.refresh()
          }}
        />
      </div>
    </div>
  )
}
