'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

type Inschrijving = {
  id: string
  inschrijvingsstatus: string
  effectieveDeelname: boolean
  createdAt: string
  uitgeschrevenOp: string | null
  uitschrijfReden: string | null
  activiteit: {
    id: string
    titel: string
    omschrijving: string | null
    datum: string
    startuur: string
    einduur: string
    locatie: string | null
    typeActiviteit: string
    status: string
    opleiding: {
      naam: string
    } | null
    aangemaaktDoor: {
      naam: string
    }
  }
}

const statusLabels: Record<string, string> = {
  ingeschreven: 'Ingeschreven',
  wachtlijst: 'Wachtlijst',
  uitgeschreven: 'Uitgeschreven',
  aanwezig: 'Aanwezig',
  afwezig: 'Afwezig',
  geannuleerd: 'Geannuleerd',
}

const statusColors: Record<string, string> = {
  ingeschreven: 'bg-green-100 text-green-800',
  wachtlijst: 'bg-yellow-100 text-yellow-800',
  uitgeschreven: 'bg-gray-100 text-gray-800',
  aanwezig: 'bg-blue-100 text-blue-800',
  afwezig: 'bg-red-100 text-red-800',
  geannuleerd: 'bg-gray-100 text-gray-600',
}

export default function InschrijvingenTable({
  inschrijvingen,
}: {
  inschrijvingen: Inschrijving[]
}) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedInschrijving, setSelectedInschrijving] = useState<Inschrijving | null>(null)

  const filteredInschrijvingen = useMemo(() => {
    let filtered = inschrijvingen

    if (statusFilter !== 'all') {
      filtered = filtered.filter((i) => i.inschrijvingsstatus === statusFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (i) =>
          i.activiteit.titel.toLowerCase().includes(query) ||
          i.activiteit.omschrijving?.toLowerCase().includes(query) ||
          i.activiteit.locatie?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [inschrijvingen, statusFilter, searchQuery])

  const stats = useMemo(() => {
    const actief = inschrijvingen.filter(
      (i) => i.inschrijvingsstatus === 'ingeschreven'
    ).length
    const komende = inschrijvingen.filter(
      (i) =>
        i.inschrijvingsstatus === 'ingeschreven' &&
        new Date(i.activiteit.datum) >= new Date()
    ).length
    const deelgenomen = inschrijvingen.filter(
      (i) => i.effectieveDeelname
    ).length

    return { actief, komende, deelgenomen, totaal: inschrijvingen.length }
  }, [inschrijvingen])

  const handleUitschrijven = async (inschrijvingId: string) => {
    setProcessing(inschrijvingId)
    setError(null)

    try {
      const response = await fetch(`/api/student/inschrijvingen/${inschrijvingId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Er is een fout opgetreden')
      }

      setSelectedInschrijving(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setProcessing(null)
    }
  }

  const isPast = (datum: string) => new Date(datum) < new Date()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Mijn Inschrijvingen
        </h1>
        <p className="text-pxl-black-light mt-4">
          Overzicht van al je inschrijvingen voor activiteiten
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Totaal</div>
          <div className="text-2xl font-bold text-pxl-gold">{stats.totaal}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Actief</div>
          <div className="text-2xl font-bold text-green-600">{stats.actief}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Komende</div>
          <div className="text-2xl font-bold text-blue-600">{stats.komende}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Deelgenomen</div>
          <div className="text-2xl font-bold text-purple-600">{stats.deelgenomen}</div>
        </div>
      </div>

      {error && !selectedInschrijving && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Zoek op titel of locatie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-48"
            >
              <option value="all">Alle statussen</option>
              <option value="ingeschreven">Ingeschreven</option>
              <option value="wachtlijst">Wachtlijst</option>
              <option value="uitgeschreven">Uitgeschreven</option>
              <option value="aanwezig">Aanwezig</option>
              <option value="afwezig">Afwezig</option>
            </select>
          </div>

          {(statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setSearchQuery('')
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredInschrijvingen.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activiteit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locatie
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deelname
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInschrijvingen.map((inschrijving) => {
                  const past = isPast(inschrijving.activiteit.datum)
                  return (
                    <tr
                      key={inschrijving.id}
                      className={past ? 'bg-gray-50' : ''}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(inschrijving.activiteit.datum).toLocaleDateString('nl-BE')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {inschrijving.activiteit.startuur} - {inschrijving.activiteit.einduur}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">
                          {inschrijving.activiteit.titel}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {inschrijving.activiteit.typeActiviteit}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {inschrijving.activiteit.locatie || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            statusColors[inschrijving.inschrijvingsstatus] ||
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {statusLabels[inschrijving.inschrijvingsstatus] ||
                            inschrijving.inschrijvingsstatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {inschrijving.effectieveDeelname ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            Deelgenomen
                          </span>
                        ) : past ? (
                          <span className="text-sm text-gray-400">-</span>
                        ) : (
                          <span className="text-sm text-gray-400">Gepland</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedInschrijving(inschrijving)}
                            className="inline-flex items-center px-3 py-1.5 border border-pxl-gold text-pxl-gold rounded hover:bg-yellow-50 font-medium transition-colors"
                          >
                            Details
                          </button>
                          {inschrijving.inschrijvingsstatus === 'ingeschreven' &&
                            !past && (
                              <button
                                onClick={() => handleUitschrijven(inschrijving.id)}
                                disabled={processing === inschrijving.id}
                                className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                              >
                                {processing === inschrijving.id ? '...' : 'Uitschrijven'}
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="font-heading font-bold text-xl text-pxl-black mb-2">
            Geen inschrijvingen gevonden
          </h3>
          <p className="text-pxl-black-light">
            {inschrijvingen.length === 0
              ? 'Je hebt je nog niet ingeschreven voor activiteiten'
              : 'Geen inschrijvingen gevonden met de huidige filters'}
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedInschrijving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="font-heading font-bold text-xl text-pxl-black">
                Inschrijving Details
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
              {/* Status */}
              <div className="flex gap-2">
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    statusColors[selectedInschrijving.inschrijvingsstatus] ||
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {statusLabels[selectedInschrijving.inschrijvingsstatus] ||
                    selectedInschrijving.inschrijvingsstatus}
                </span>
                {selectedInschrijving.effectieveDeelname && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                    Deelgenomen
                  </span>
                )}
              </div>

              {/* Activity Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-heading font-bold text-lg text-pxl-black mb-3">
                  {selectedInschrijving.activiteit.titel}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Datum</div>
                    <div className="font-medium">
                      {new Date(selectedInschrijving.activiteit.datum).toLocaleDateString(
                        'nl-BE',
                        {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Tijd</div>
                    <div className="font-medium">
                      {selectedInschrijving.activiteit.startuur} -{' '}
                      {selectedInschrijving.activiteit.einduur}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Type</div>
                    <div className="font-medium capitalize">
                      {selectedInschrijving.activiteit.typeActiviteit}
                    </div>
                  </div>
                  {selectedInschrijving.activiteit.locatie && (
                    <div>
                      <div className="text-sm text-gray-500">Locatie</div>
                      <div className="font-medium">
                        {selectedInschrijving.activiteit.locatie}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-500">Organisator</div>
                    <div className="font-medium">
                      {selectedInschrijving.activiteit.aangemaaktDoor.naam}
                    </div>
                  </div>
                  {selectedInschrijving.activiteit.opleiding && (
                    <div>
                      <div className="text-sm text-gray-500">Opleiding</div>
                      <div className="font-medium">
                        {selectedInschrijving.activiteit.opleiding.naam}
                      </div>
                    </div>
                  )}
                </div>

                {selectedInschrijving.activiteit.omschrijving && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 mb-1">Omschrijving</div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedInschrijving.activiteit.omschrijving}
                    </p>
                  </div>
                )}
              </div>

              {/* Registration Info */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Inschrijving Info</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    Ingeschreven op:{' '}
                    {new Date(selectedInschrijving.createdAt).toLocaleDateString('nl-BE')}
                  </div>
                  {selectedInschrijving.uitgeschrevenOp && (
                    <div>
                      Uitgeschreven op:{' '}
                      {new Date(selectedInschrijving.uitgeschrevenOp).toLocaleDateString(
                        'nl-BE'
                      )}
                    </div>
                  )}
                  {selectedInschrijving.uitschrijfReden && (
                    <div>Reden: {selectedInschrijving.uitschrijfReden}</div>
                  )}
                </div>
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
                onClick={() => setSelectedInschrijving(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 font-medium transition-colors"
              >
                Sluiten
              </button>
              {selectedInschrijving.inschrijvingsstatus === 'ingeschreven' &&
                !isPast(selectedInschrijving.activiteit.datum) && (
                  <button
                    onClick={() => handleUitschrijven(selectedInschrijving.id)}
                    disabled={processing === selectedInschrijving.id}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                  >
                    {processing === selectedInschrijving.id ? 'Bezig...' : 'Uitschrijven'}
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
