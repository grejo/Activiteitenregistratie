'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type OpschoonbareStudent = {
  id: string
  naam: string
  email: string
  actief: boolean
  gearchiveerd: boolean
  opleiding: string | null
  aantalBestanden: number
}

export default function OpschoningTable({
  studenten,
}: {
  studenten: OpschoonbareStudent[]
}) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [showConfirmAll, setShowConfirmAll] = useState(false)

  const totaalBestanden = studenten.reduce((sum, s) => sum + s.aantalBestanden, 0)

  const opschonen = async (studentId?: string) => {
    setProcessing(studentId ?? 'all')
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/opschoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentId ? { studentId } : {}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Er is iets misgegaan')
      setResult(
        `${data.verwijderdeBestanden} bestand(en) verwijderd voor ${data.aantalStudenten} student(en). Metadata is bewaard.`
      )
      setShowConfirmAll(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {result && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {result}
        </div>
      )}

      {studenten.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="font-heading font-bold text-xl text-pxl-black mb-2">
            Niets op te schonen
          </h3>
          <p className="text-pxl-black-light">
            Er zijn geen uitgeschreven of afgestudeerde studenten met te verwijderen
            bestanden.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-gray-600">
              {studenten.length} student(en) met samen {totaalBestanden} te verwijderen
              bestand(en).
            </p>
            {showConfirmAll ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-700">
                  Alle bestanden definitief verwijderen?
                </span>
                <button
                  onClick={() => opschonen()}
                  disabled={processing !== null}
                  className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                >
                  {processing === 'all' ? 'Bezig...' : 'Ja, alles opschonen'}
                </button>
                <button
                  onClick={() => setShowConfirmAll(false)}
                  disabled={processing !== null}
                  className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
                >
                  Annuleren
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmAll(true)}
                className="btn-primary"
                disabled={processing !== null}
              >
                Alles opschonen
              </button>
            )}
          </div>

          <div className="card overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Opleiding</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Bestanden</th>
                  <th className="px-4 py-3 text-right">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {studenten.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.naam}</div>
                      <div className="text-xs text-gray-500">{s.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.opleiding || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {s.gearchiveerd ? 'Gearchiveerd' : 'Inactief'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.aantalBestanden}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => opschonen(s.id)}
                        disabled={processing !== null}
                        className="px-3 py-1.5 border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50 text-sm font-medium"
                      >
                        {processing === s.id ? 'Bezig...' : 'Opschonen'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
