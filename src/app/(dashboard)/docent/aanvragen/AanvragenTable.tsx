'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Aanvraag = {
  id: string
  titel: string
  omschrijving: string | null
  datum: string
  createdAt: string
  typeActiviteit: string
  aard: string | null
  startuur: string
  einduur: string
  locatie: string | null
  weblink: string | null
  organisatorPxl: string | null
  organisatorExtern: string | null
  bewijslink: string | null
  aangemaaktDoor: {
    id: string
    naam: string
    email: string
    opleiding: {
      naam: string
    } | null
  }
  opleiding: {
    naam: string
  } | null
}

export default function AanvragenTable({ aanvragen }: { aanvragen: Aanvraag[] }) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedAanvraag, setSelectedAanvraag] = useState<Aanvraag | null>(null)
  const [opmerkingen, setOpmerkingen] = useState('')

  const handleAction = async (id: string, action: 'goedkeuren' | 'afkeuren') => {
    setProcessing(id)
    setError(null)

    try {
      const newStatus = action === 'goedkeuren' ? 'goedgekeurd' : 'afgekeurd'

      const response = await fetch(`/api/docent/aanvragen/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, opmerkingen }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Er is een fout opgetreden')
      }

      setSelectedAanvraag(null)
      setOpmerkingen('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setProcessing(null)
    }
  }

  const openModal = (aanvraag: Aanvraag) => {
    setSelectedAanvraag(aanvraag)
    setOpmerkingen('')
    setError(null)
  }

  const closeModal = () => {
    setSelectedAanvraag(null)
    setOpmerkingen('')
    setError(null)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Student Aanvragen
        </h1>
        <p className="text-pxl-black-light mt-4">
          Bekijk en behandel activiteiten aangevraagd door studenten
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Te behandelen</div>
          <div className="text-2xl font-bold text-pxl-gold">{aanvragen.length}</div>
        </div>
      </div>

      {error && !selectedAanvraag && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Table */}
      {aanvragen.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aangevraagd op
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activiteit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum Activiteit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {aanvragen.map((aanvraag) => (
                  <tr key={aanvraag.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(aanvraag.createdAt).toLocaleDateString('nl-BE')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        {aanvraag.aangemaaktDoor.naam}
                      </div>
                      <div className="text-sm text-gray-500">
                        {aanvraag.aangemaaktDoor.email}
                      </div>
                      {aanvraag.aangemaaktDoor.opleiding && (
                        <div className="text-xs text-gray-400">
                          {aanvraag.aangemaaktDoor.opleiding.naam}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{aanvraag.titel}</div>
                      {aanvraag.omschrijving && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {aanvraag.omschrijving}
                        </div>
                      )}
                      {aanvraag.locatie && (
                        <div className="text-xs text-gray-400">{aanvraag.locatie}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(aanvraag.datum).toLocaleDateString('nl-BE')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openModal(aanvraag)}
                          className="inline-flex items-center px-3 py-1.5 border border-pxl-gold text-pxl-gold rounded hover:bg-yellow-50 font-medium transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleAction(aanvraag.id, 'goedkeuren')}
                          disabled={processing === aanvraag.id}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
                        >
                          {processing === aanvraag.id ? '...' : 'Goedkeuren'}
                        </button>
                        <button
                          onClick={() => handleAction(aanvraag.id, 'afkeuren')}
                          disabled={processing === aanvraag.id}
                          className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                        >
                          {processing === aanvraag.id ? '...' : 'Afkeuren'}
                        </button>
                      </div>
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
            Geen openstaande aanvragen
          </h3>
          <p className="text-pxl-black-light">
            Er zijn momenteel geen student aanvragen die behandeld moeten worden.
          </p>
        </div>
      )}

      {/* Modal */}
      {selectedAanvraag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="font-heading font-bold text-xl text-pxl-black">
                Aanvraag Details
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Aangevraagd door</h3>
                <div className="font-medium text-gray-900">{selectedAanvraag.aangemaaktDoor.naam}</div>
                <div className="text-sm text-gray-500">{selectedAanvraag.aangemaaktDoor.email}</div>
                {selectedAanvraag.aangemaaktDoor.opleiding && (
                  <div className="text-sm text-gray-500">{selectedAanvraag.aangemaaktDoor.opleiding.naam}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  Aangevraagd op {new Date(selectedAanvraag.createdAt).toLocaleDateString('nl-BE')}
                </div>
              </div>

              {/* Activity Details */}
              <div>
                <h3 className="font-heading font-bold text-lg text-pxl-black mb-3">
                  {selectedAanvraag.titel}
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Datum</div>
                    <div className="font-medium">
                      {new Date(selectedAanvraag.datum).toLocaleDateString('nl-BE')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Tijd</div>
                    <div className="font-medium">
                      {selectedAanvraag.startuur} - {selectedAanvraag.einduur}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Type</div>
                    <div className="font-medium capitalize">{selectedAanvraag.typeActiviteit}</div>
                  </div>
                  {selectedAanvraag.aard && (
                    <div>
                      <div className="text-sm text-gray-500">Aard</div>
                      <div className="font-medium capitalize">{selectedAanvraag.aard}</div>
                    </div>
                  )}
                  {selectedAanvraag.locatie && (
                    <div>
                      <div className="text-sm text-gray-500">Locatie</div>
                      <div className="font-medium">{selectedAanvraag.locatie}</div>
                    </div>
                  )}
                  {selectedAanvraag.opleiding && (
                    <div>
                      <div className="text-sm text-gray-500">Opleiding</div>
                      <div className="font-medium">{selectedAanvraag.opleiding.naam}</div>
                    </div>
                  )}
                </div>

                {selectedAanvraag.omschrijving && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Omschrijving</div>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedAanvraag.omschrijving}</p>
                  </div>
                )}

                {/* Organisator */}
                {(selectedAanvraag.organisatorPxl || selectedAanvraag.organisatorExtern) && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Organisator</div>
                    {selectedAanvraag.organisatorPxl && (
                      <div className="text-sm"><span className="font-medium">PXL:</span> {selectedAanvraag.organisatorPxl}</div>
                    )}
                    {selectedAanvraag.organisatorExtern && (
                      <div className="text-sm"><span className="font-medium">Extern:</span> {selectedAanvraag.organisatorExtern}</div>
                    )}
                  </div>
                )}

                {/* Links */}
                {(selectedAanvraag.weblink || selectedAanvraag.bewijslink) && (
                  <div className="flex flex-wrap gap-3">
                    {selectedAanvraag.weblink && (
                      <a
                        href={selectedAanvraag.weblink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        Website/Info
                      </a>
                    )}
                    {selectedAanvraag.bewijslink && (
                      <a
                        href={selectedAanvraag.bewijslink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        Bewijs/Documentatie
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Opmerkingen */}
              <div>
                <label htmlFor="opmerkingen" className="block text-sm font-medium text-gray-700 mb-1">
                  Opmerkingen (optioneel)
                </label>
                <textarea
                  id="opmerkingen"
                  value={opmerkingen}
                  onChange={(e) => setOpmerkingen(e.target.value)}
                  rows={3}
                  className="input-field w-full"
                  placeholder="Eventuele feedback voor de student..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 font-medium transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleAction(selectedAanvraag.id, 'afkeuren')}
                disabled={processing === selectedAanvraag.id}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
              >
                {processing === selectedAanvraag.id ? 'Bezig...' : 'Afkeuren'}
              </button>
              <button
                onClick={() => handleAction(selectedAanvraag.id, 'goedkeuren')}
                disabled={processing === selectedAanvraag.id}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
              >
                {processing === selectedAanvraag.id ? 'Bezig...' : 'Goedkeuren'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
