'use client'

import { useState } from 'react'

type Opleiding = { id: string; naam: string }

type GebruikersResultaat = {
  studenten: { aangemaakt: number; bijgewerkt: number; totaal: number }
  docenten: { aangemaakt: number; bijgewerkt: number; totaal: number }
  errors: string[]
}

type ActiviteitenResultaat = {
  activiteiten: { aangemaakt: number; overgeslagen: number }
  inschrijvingen: { aangemaakt: number }
  errors: string[]
}

type ResetResultaat = {
  verwijderdeStudenten: number
  verwijderdeActiviteiten: number
}

export default function ImportModule({ opleidingen }: { opleidingen: Opleiding[] }) {
  // Sectie 1: gebruikers
  const [gebruikersFile, setGebruikersFile] = useState<File | null>(null)
  const [gebruikersOpleidingId, setGebruikersOpleidingId] = useState('')
  const [gebruikersLoading, setGebruikersLoading] = useState(false)
  const [gebruikersResultaat, setGebruikersResultaat] = useState<GebruikersResultaat | null>(null)
  const [gebruikersError, setGebruikersError] = useState<string | null>(null)

  // Sectie 2: activiteiten
  const [activiteitenFile, setActiviteitenFile] = useState<File | null>(null)
  const [activiteitenOpleidingId, setActiviteitenOpleidingId] = useState('')
  const [activiteitenLoading, setActiviteitenLoading] = useState(false)
  const [activiteitenResultaat, setActiviteitenResultaat] = useState<ActiviteitenResultaat | null>(null)
  const [activiteitenError, setActiviteitenError] = useState<string | null>(null)

  // Sectie 3: herbereken voortgang
  const [herberekenenLoading, setHerberekenenLoading] = useState(false)
  const [herberekenenResultaat, setHerberekenenResultaat] = useState<{ verwerkt: number; totaal: number; errors: string[] } | null>(null)
  const [herberekenenError, setHerberekenenError] = useState<string | null>(null)

  // Sectie 4: reset
  const [resetOpleidingId, setResetOpleidingId] = useState('')
  const [deleteStudenten, setDeleteStudenten] = useState(true)
  const [deleteActiviteiten, setDeleteActiviteiten] = useState(true)
  const [bevestigingNaam, setBevestigingNaam] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetResultaat, setResetResultaat] = useState<ResetResultaat | null>(null)
  const [resetError, setResetError] = useState<string | null>(null)

  const geselecteerdeResetOpleiding = opleidingen.find((o) => o.id === resetOpleidingId)
  const resetBevestigd = geselecteerdeResetOpleiding?.naam === bevestigingNaam

  async function importeerGebruikers() {
    if (!gebruikersFile || !gebruikersOpleidingId) return
    setGebruikersLoading(true)
    setGebruikersError(null)
    setGebruikersResultaat(null)
    try {
      const formData = new FormData()
      formData.append('file', gebruikersFile)
      formData.append('opleidingId', gebruikersOpleidingId)
      const res = await fetch('/api/admin/import/gebruikers', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Importfout')
      setGebruikersResultaat(data)
    } catch (e) {
      setGebruikersError(e instanceof Error ? e.message : 'Er is iets misgegaan')
    } finally {
      setGebruikersLoading(false)
    }
  }

  async function importeerActiviteiten() {
    if (!activiteitenFile) return
    setActiviteitenLoading(true)
    setActiviteitenError(null)
    setActiviteitenResultaat(null)
    try {
      const formData = new FormData()
      formData.append('file', activiteitenFile)
      if (activiteitenOpleidingId) formData.append('opleidingId', activiteitenOpleidingId)
      const res = await fetch('/api/admin/import/activiteiten', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Importfout')
      setActiviteitenResultaat(data)
    } catch (e) {
      setActiviteitenError(e instanceof Error ? e.message : 'Er is iets misgegaan')
    } finally {
      setActiviteitenLoading(false)
    }
  }

  async function herbereken() {
    setHerberekenenLoading(true)
    setHerberekenenError(null)
    setHerberekenenResultaat(null)
    try {
      const res = await fetch('/api/admin/recalculate-voortgang', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fout bij herberekenen')
      setHerberekenenResultaat(data)
    } catch (e) {
      setHerberekenenError(e instanceof Error ? e.message : 'Er is iets misgegaan')
    } finally {
      setHerberekenenLoading(false)
    }
  }

  async function resetData() {
    if (!resetOpleidingId || !resetBevestigd) return
    setResetLoading(true)
    setResetError(null)
    setResetResultaat(null)
    try {
      const res = await fetch('/api/admin/import/reset', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opleidingId: resetOpleidingId, deleteStudenten, deleteActiviteiten }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fout bij verwijderen')
      setResetResultaat(data)
      setBevestigingNaam('')
    } catch (e) {
      setResetError(e instanceof Error ? e.message : 'Er is iets misgegaan')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="space-y-8">

      {/* Sectie 1: Gebruikers */}
      <div className="card">
        <h2 className="font-heading font-bold text-xl text-pxl-black mb-1">Stap 1 — Gebruikers importeren</h2>
        <p className="text-sm text-pxl-black-light mb-6">
          Importeer studenten en docenten op basis van de e-mailadressen in het Excel-bestand.
          Voer dit <strong>vóór</strong> de activiteitenimport uit.
        </p>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opleiding (voor studenten)</label>
            <select
              value={gebruikersOpleidingId}
              onChange={(e) => setGebruikersOpleidingId(e.target.value)}
              className="input-field w-full"
            >
              <option value="">— Selecteer opleiding —</option>
              {opleidingen.map((o) => (
                <option key={o.id} value={o.id}>{o.naam}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excel-bestand (.xlsx)</label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setGebruikersFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-pxl-gold file:text-white hover:file:bg-yellow-600 cursor-pointer"
            />
          </div>

          <button
            onClick={importeerGebruikers}
            disabled={!gebruikersFile || !gebruikersOpleidingId || gebruikersLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {gebruikersLoading ? 'Bezig met importeren…' : 'Importeer gebruikers'}
          </button>
        </div>

        {gebruikersError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{gebruikersError}</div>
        )}

        {gebruikersResultaat && (
          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="card-flat">
                <div className="text-sm text-pxl-black-light">Studenten</div>
                <div className="text-xl font-bold text-pxl-gold">{gebruikersResultaat.studenten.totaal}</div>
                <div className="text-xs text-gray-500">
                  {gebruikersResultaat.studenten.aangemaakt} nieuw · {gebruikersResultaat.studenten.bijgewerkt} bijgewerkt
                </div>
              </div>
              <div className="card-flat">
                <div className="text-sm text-pxl-black-light">Docenten</div>
                <div className="text-xl font-bold text-blue-600">{gebruikersResultaat.docenten.totaal}</div>
                <div className="text-xs text-gray-500">
                  {gebruikersResultaat.docenten.aangemaakt} nieuw · {gebruikersResultaat.docenten.bijgewerkt} bijgewerkt
                </div>
              </div>
            </div>
            {gebruikersResultaat.errors.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-red-600 font-medium">
                  {gebruikersResultaat.errors.length} fout(en)
                </summary>
                <ul className="mt-2 space-y-1 text-red-700 bg-red-50 p-3 rounded">
                  {gebruikersResultaat.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Sectie 2: Activiteiten */}
      <div className="card">
        <h2 className="font-heading font-bold text-xl text-pxl-black mb-1">Stap 2 — Activiteiten importeren</h2>
        <p className="text-sm text-pxl-black-light mb-6">
          Importeer activiteiten met beentje-classificatie en koppel inschrijvingen aan studenten.
          Zorg dat gebruikers al geïmporteerd zijn.
        </p>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opleiding (optioneel)</label>
            <select
              value={activiteitenOpleidingId}
              onChange={(e) => setActiviteitenOpleidingId(e.target.value)}
              className="input-field w-full"
            >
              <option value="">— Geen specifieke opleiding —</option>
              {opleidingen.map((o) => (
                <option key={o.id} value={o.id}>{o.naam}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excel-bestand (.xlsx)</label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setActiviteitenFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-pxl-gold file:text-white hover:file:bg-yellow-600 cursor-pointer"
            />
          </div>

          <button
            onClick={importeerActiviteiten}
            disabled={!activiteitenFile || activiteitenLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activiteitenLoading ? 'Bezig met importeren…' : 'Importeer activiteiten'}
          </button>
        </div>

        {activiteitenError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{activiteitenError}</div>
        )}

        {activiteitenResultaat && (
          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="card-flat">
                <div className="text-sm text-pxl-black-light">Activiteiten</div>
                <div className="text-xl font-bold text-green-600">{activiteitenResultaat.activiteiten.aangemaakt}</div>
                <div className="text-xs text-gray-500">aangemaakt</div>
              </div>
              <div className="card-flat">
                <div className="text-sm text-pxl-black-light">Overgeslagen</div>
                <div className="text-xl font-bold text-gray-500">{activiteitenResultaat.activiteiten.overgeslagen}</div>
                <div className="text-xs text-gray-500">parse-fouten</div>
              </div>
              <div className="card-flat">
                <div className="text-sm text-pxl-black-light">Inschrijvingen</div>
                <div className="text-xl font-bold text-pxl-gold">{activiteitenResultaat.inschrijvingen.aangemaakt}</div>
                <div className="text-xs text-gray-500">aangemaakt</div>
              </div>
            </div>
            {activiteitenResultaat.errors.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-red-600 font-medium">
                  {activiteitenResultaat.errors.length} fout(en)
                </summary>
                <ul className="mt-2 space-y-1 text-red-700 bg-red-50 p-3 rounded max-h-48 overflow-y-auto">
                  {activiteitenResultaat.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Sectie 3: Herbereken voortgang */}
      <div className="card">
        <h2 className="font-heading font-bold text-xl text-pxl-black mb-1">Stap 3 — Scorekaart herberekenen</h2>
        <p className="text-sm text-pxl-black-light mb-6">
          Herbereken de voortgang (beentje-tellers) voor alle actieve studenten. Voer dit uit na een activiteitenimport
          om de scorekaarten bij te werken.
        </p>

        <button
          onClick={herbereken}
          disabled={herberekenenLoading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {herberekenenLoading ? 'Bezig met herberekenen…' : 'Herbereken voortgang alle studenten'}
        </button>

        {herberekenenError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{herberekenenError}</div>
        )}

        {herberekenenResultaat && (
          <div className="mt-4 space-y-2">
            <div className="p-4 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              ✓ Voortgang herberekend voor {herberekenenResultaat.verwerkt} van {herberekenenResultaat.totaal} studenten
            </div>
            {herberekenenResultaat.errors.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-red-600 font-medium">
                  {herberekenenResultaat.errors.length} fout(en)
                </summary>
                <ul className="mt-2 space-y-1 text-red-700 bg-red-50 p-3 rounded max-h-48 overflow-y-auto">
                  {herberekenenResultaat.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Sectie 4: Reset */}
      <div className="card border-2 border-red-200">
        <h2 className="font-heading font-bold text-xl text-red-700 mb-1">Stap 4 — Gevarenzone: dummy data verwijderen</h2>
        <p className="text-sm text-gray-600 mb-6">
          Verwijder alle studenten en/of activiteiten van een opleiding. Dit kan niet ongedaan worden gemaakt.
        </p>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opleiding</label>
            <select
              value={resetOpleidingId}
              onChange={(e) => { setResetOpleidingId(e.target.value); setBevestigingNaam('') }}
              className="input-field w-full"
            >
              <option value="">— Selecteer opleiding —</option>
              {opleidingen.map((o) => (
                <option key={o.id} value={o.id}>{o.naam}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteStudenten}
                onChange={(e) => setDeleteStudenten(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Studenten van deze opleiding verwijderen</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteActiviteiten}
                onChange={(e) => setDeleteActiviteiten(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Activiteiten van deze opleiding verwijderen</span>
            </label>
          </div>

          {resetOpleidingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ <strong>{geselecteerdeResetOpleiding?.naam}</strong> ter bevestiging
              </label>
              <input
                type="text"
                value={bevestigingNaam}
                onChange={(e) => setBevestigingNaam(e.target.value)}
                placeholder={geselecteerdeResetOpleiding?.naam}
                className="input-field w-full"
              />
            </div>
          )}

          <button
            onClick={resetData}
            disabled={!resetOpleidingId || !resetBevestigd || (!deleteStudenten && !deleteActiviteiten) || resetLoading}
            className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {resetLoading ? 'Bezig met verwijderen…' : 'Verwijder geselecteerde data'}
          </button>
        </div>

        {resetError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{resetError}</div>
        )}

        {resetResultaat && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            ✓ Verwijderd: {resetResultaat.verwijderdeStudenten} student(en), {resetResultaat.verwijderdeActiviteiten} activiteit(en)
          </div>
        )}
      </div>
    </div>
  )
}
