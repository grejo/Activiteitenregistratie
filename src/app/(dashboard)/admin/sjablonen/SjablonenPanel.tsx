'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Sjabloon = {
  id: string
  naam: string
  beschrijving: string | null
  bestandsnaam: string | null
  opleiding: { id: string; naam: string }
}

type Opleiding = { id: string; naam: string }

export default function SjablonenPanel({
  sjablonen,
  opleidingen,
}: {
  sjablonen: Sjabloon[]
  opleidingen: Opleiding[]
}) {
  const router = useRouter()
  const [naam, setNaam] = useState('')
  const [beschrijving, setBeschrijving] = useState('')
  const [opleidingId, setOpleidingId] = useState(opleidingen[0]?.id ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('naam', naam)
      fd.append('beschrijving', beschrijving)
      fd.append('opleidingId', opleidingId)
      if (file) fd.append('bestand', file)
      const r = await fetch('/api/admin/sjablonen', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Er ging iets mis')
      setNaam('')
      setBeschrijving('')
      setFile(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Verwijder dit sjabloon?')) return
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/sjablonen/${id}`, { method: 'DELETE' })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j.error || 'Verwijderen mislukt')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verwijderen mislukt')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="card space-y-4">
        <h2 className="font-heading font-bold text-lg">Nieuw sjabloon</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Naam *</label>
            <input
              type="text"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              required
              className="input-field mt-1 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Opleiding *</label>
            <select
              value={opleidingId}
              onChange={(e) => setOpleidingId(e.target.value)}
              required
              className="input-field mt-1 w-full"
            >
              {opleidingen.map((o) => (
                <option key={o.id} value={o.id}>{o.naam}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Beschrijving</label>
          <textarea
            value={beschrijving}
            onChange={(e) => setBeschrijving(e.target.value)}
            rows={2}
            className="input-field mt-1 w-full"
            placeholder="Korte omschrijving (optioneel)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Bestand (PDF/DOCX/XLSX, max 10 MB)</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
          />
        </div>
        <button type="submit" disabled={busy || !opleidingId} className="btn-primary">
          {busy ? 'Bezig…' : 'Sjabloon toevoegen'}
        </button>
      </form>

      <div className="card">
        <h2 className="font-heading font-bold text-lg mb-4">Alle sjablonen</h2>
        {sjablonen.length === 0 ? (
          <p className="text-sm text-gray-500">Nog geen sjablonen toegevoegd.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Opleiding</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Naam</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bestand</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sjablonen.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 text-sm">{s.opleiding.naam}</td>
                  <td className="px-3 py-2 text-sm">
                    <div className="font-medium">{s.naam}</div>
                    {s.beschrijving && (
                      <div className="text-xs text-gray-500">{s.beschrijving}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500">
                    {s.bestandsnaam ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-sm">
                    {s.bestandsnaam && (
                      <a
                        href={`/api/sjablonen/${s.id}/download`}
                        className="text-pxl-gold hover:underline mr-3"
                      >
                        ⬇︎ Download
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-red-600 hover:underline"
                      disabled={busy}
                    >
                      Verwijderen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
