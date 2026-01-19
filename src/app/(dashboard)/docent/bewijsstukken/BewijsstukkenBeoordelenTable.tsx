'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Bewijsstuk = {
  id: string
  type: string
  bestandsnaam: string
  bestandspad: string
  uploadedAt: string
}

type Inschrijving = {
  id: string
  bewijsStatus: string
  bewijsIngediendOp: string | null
  bewijsstukken: Bewijsstuk[]
  activiteit: {
    id: string
    titel: string
    typeActiviteit: string
    datum: string
    startuur: string
    einduur: string
    locatie: string | null
  }
  student: {
    id: string
    naam: string
    email: string
    opleiding: {
      naam: string
    } | null
  }
}

const typeLabels: Record<string, string> = {
  handtekeninglijst: 'Handtekeninglijst',
  foto_deelnemers: 'Foto deelnemers',
  extra_bijlage: 'Extra bijlage',
  certificaat: 'Certificaat',
  bewijs_deelname: 'Bewijs deelname',
}

export default function BewijsstukkenBeoordelenTable({
  inschrijvingen,
}: {
  inschrijvingen: Inschrijving[]
}) {
  const router = useRouter()
  const [selectedInschrijving, setSelectedInschrijving] = useState<Inschrijving | null>(null)
  const [processingAction, setProcessingAction] = useState<'goedkeuren' | 'afkeuren' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  const handleAction = async (actie: 'goedkeuren' | 'afkeuren') => {
    if (!selectedInschrijving) return

    if (actie === 'afkeuren' && !feedback.trim()) {
      setError('Geef feedback bij afkeuring zodat de student weet wat er ontbreekt.')
      return
    }

    setProcessingAction(actie)
    setError(null)

    try {
      const response = await fetch(`/api/docent/bewijsstukken/${selectedInschrijving.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actie, feedback: feedback.trim() || null }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is een fout opgetreden')
      }

      // Sluit modal en reset state
      setSelectedInschrijving(null)
      setFeedback('')
      setProcessingAction(null)

      // Trigger event om navbar counts te refreshen
      window.dispatchEvent(new CustomEvent('refresh-counts'))

      // Refresh de pagina om de bijgewerkte data te laden
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      setProcessingAction(null)
    }
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return '🖼️'
    }
    if (ext === 'pdf') {
      return '📄'
    }
    return '📎'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Bewijsstukken Beoordelen
        </h1>
        <p className="text-pxl-black-light mt-4">
          Beoordeel ingediende bewijsstukken van studenten
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Te beoordelen</div>
          <div className="text-2xl font-bold text-pxl-gold">{inschrijvingen.length}</div>
        </div>
      </div>

      {/* Table */}
      {inschrijvingen.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingediend op
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activiteit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bewijsstukken
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inschrijvingen.map((inschrijving) => (
                  <tr key={inschrijving.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inschrijving.bewijsIngediendOp
                        ? new Date(inschrijving.bewijsIngediendOp).toLocaleDateString('nl-BE', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{inschrijving.student.naam}</div>
                      <div className="text-sm text-gray-500">{inschrijving.student.email}</div>
                      {inschrijving.student.opleiding && (
                        <div className="text-xs text-gray-400">{inschrijving.student.opleiding.naam}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{inschrijving.activiteit.titel}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(inschrijving.activiteit.datum).toLocaleDateString('nl-BE')} | {inschrijving.activiteit.startuur} - {inschrijving.activiteit.einduur}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {inschrijving.bewijsstukken.length} bestand{inschrijving.bewijsstukken.length !== 1 ? 'en' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedInschrijving(inschrijving)
                          setFeedback('')
                          setError(null)
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-pxl-gold text-pxl-gold rounded hover:bg-yellow-50 font-medium transition-colors"
                      >
                        Beoordelen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">&#10003;</div>
          <h3 className="font-heading font-bold text-xl text-pxl-black mb-2">
            Geen openstaande bewijsstukken
          </h3>
          <p className="text-pxl-black-light">
            Er zijn momenteel geen bewijsstukken die beoordeeld moeten worden.
          </p>
        </div>
      )}

      {/* Modal */}
      {selectedInschrijving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="font-heading font-bold text-xl text-pxl-black">
                Bewijsstukken Beoordelen
              </h2>
              <button
                onClick={() => setSelectedInschrijving(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Student</h3>
                <div className="font-medium text-gray-900">{selectedInschrijving.student.naam}</div>
                <div className="text-sm text-gray-500">{selectedInschrijving.student.email}</div>
                {selectedInschrijving.student.opleiding && (
                  <div className="text-sm text-gray-500">{selectedInschrijving.student.opleiding.naam}</div>
                )}
              </div>

              {/* Activity Info */}
              <div>
                <h3 className="font-heading font-bold text-lg text-pxl-black mb-3">
                  {selectedInschrijving.activiteit.titel}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Datum</div>
                    <div className="font-medium">
                      {new Date(selectedInschrijving.activiteit.datum).toLocaleDateString('nl-BE')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Tijd</div>
                    <div className="font-medium">
                      {selectedInschrijving.activiteit.startuur} - {selectedInschrijving.activiteit.einduur}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Type</div>
                    <div className="font-medium capitalize">{selectedInschrijving.activiteit.typeActiviteit}</div>
                  </div>
                  {selectedInschrijving.activiteit.locatie && (
                    <div>
                      <div className="text-sm text-gray-500">Locatie</div>
                      <div className="font-medium">{selectedInschrijving.activiteit.locatie}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bewijsstukken */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Ingediende bewijsstukken ({selectedInschrijving.bewijsstukken.length})
                </h4>
                <div className="space-y-2">
                  {selectedInschrijving.bewijsstukken.map((bewijsstuk) => (
                    <div
                      key={bewijsstuk.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl">{getFileIcon(bewijsstuk.bestandsnaam)}</span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {bewijsstuk.bestandsnaam}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{typeLabels[bewijsstuk.type] || bewijsstuk.type}</span>
                            <span>•</span>
                            <span>
                              {new Date(bewijsstuk.uploadedAt).toLocaleDateString('nl-BE', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={bewijsstuk.bestandspad}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-colors"
                      >
                        Bekijken
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div className="border-t pt-4">
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback (verplicht bij afkeuring)
                </label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="input-field w-full"
                  placeholder="Geef feedback aan de student (bv. ontbrekende informatie, onduidelijk bewijs, etc.)..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setSelectedInschrijving(null)}
                disabled={processingAction !== null}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleAction('afkeuren')}
                disabled={processingAction !== null}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
              >
                {processingAction === 'afkeuren' ? 'Bezig...' : 'Afkeuren'}
              </button>
              <button
                onClick={() => handleAction('goedkeuren')}
                disabled={processingAction !== null}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
              >
                {processingAction === 'goedkeuren' ? 'Bezig...' : 'Goedkeuren'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
