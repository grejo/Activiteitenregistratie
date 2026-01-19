'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

type Activiteit = {
  id: string
  titel: string
  omschrijving: string | null
  datum: string
  startuur: string
  einduur: string
  locatie: string | null
  weblink: string | null
  typeActiviteit: string
  maxPlaatsen: number | null
  opleiding: {
    naam: string
  } | null
  aangemaaktDoor: {
    naam: string
  }
  _count: {
    inschrijvingen: number
  }
}

export default function PrikbordTable({
  activiteiten,
  mijnInschrijvingen,
}: {
  activiteiten: Activiteit[]
  mijnInschrijvingen: string[]
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedActiviteit, setSelectedActiviteit] = useState<Activiteit | null>(null)

  const filteredActiviteiten = useMemo(() => {
    let filtered = activiteiten

    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.typeActiviteit === typeFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.titel.toLowerCase().includes(query) ||
          a.omschrijving?.toLowerCase().includes(query) ||
          a.locatie?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [activiteiten, typeFilter, searchQuery])

  const uniqueTypes = useMemo(() => {
    const types = new Set(activiteiten.map((a) => a.typeActiviteit))
    return Array.from(types).sort()
  }, [activiteiten])

  const handleInschrijven = async (activiteitId: string) => {
    setProcessing(activiteitId)
    setError(null)

    try {
      const response = await fetch('/api/student/inschrijvingen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activiteitId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Er is een fout opgetreden')
      }

      setSelectedActiviteit(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setProcessing(null)
    }
  }

  const isIngeschreven = (activiteitId: string) => mijnInschrijvingen.includes(activiteitId)

  const isVol = (activiteit: Activiteit) =>
    activiteit.maxPlaatsen !== null && activiteit._count.inschrijvingen >= activiteit.maxPlaatsen

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Prikbord
        </h1>
        <p className="text-pxl-black-light mt-4">
          Bekijk en schrijf je in voor beschikbare activiteiten
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Beschikbare Activiteiten</div>
          <div className="text-2xl font-bold text-pxl-gold">{activiteiten.length}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Mijn Inschrijvingen</div>
          <div className="text-2xl font-bold text-green-600">{mijnInschrijvingen.length}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Weergegeven</div>
          <div className="text-2xl font-bold text-blue-600">{filteredActiviteiten.length}</div>
        </div>
      </div>

      {error && (
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
              placeholder="Zoek op titel, omschrijving of locatie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="type-filter" className="text-sm font-medium text-gray-700">
              Type:
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field w-48"
            >
              <option value="all">Alle types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {(typeFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setTypeFilter('all')
                setSearchQuery('')
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Activiteiten Grid */}
      {filteredActiviteiten.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActiviteiten.map((activiteit) => {
            const ingeschreven = isIngeschreven(activiteit.id)
            const vol = isVol(activiteit)

            return (
              <div key={activiteit.id} className="card flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium capitalize">
                    {activiteit.typeActiviteit}
                  </span>
                  {ingeschreven && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      Ingeschreven
                    </span>
                  )}
                  {!ingeschreven && vol && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                      Volzet
                    </span>
                  )}
                </div>

                {/* Content */}
                <h3 className="font-heading font-bold text-lg text-pxl-black mb-2">
                  {activiteit.titel}
                </h3>

                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{new Date(activiteit.datum).toLocaleDateString('nl-BE')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🕐</span>
                    <span>{activiteit.startuur} - {activiteit.einduur}</span>
                  </div>
                  {activiteit.locatie && (
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span className="truncate">{activiteit.locatie}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span>👤</span>
                    <span>{activiteit.aangemaaktDoor.naam}</span>
                  </div>
                </div>

                {activiteit.omschrijving && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {activiteit.omschrijving}
                  </p>
                )}

                {/* Plaatsen */}
                <div className="text-sm text-gray-500 mb-4">
                  {activiteit.maxPlaatsen ? (
                    <span>
                      {activiteit._count.inschrijvingen} / {activiteit.maxPlaatsen} plaatsen bezet
                    </span>
                  ) : (
                    <span>{activiteit._count.inschrijvingen} ingeschreven</span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => setSelectedActiviteit(activiteit)}
                    className="flex-1 px-3 py-2 border border-pxl-gold text-pxl-gold rounded hover:bg-yellow-50 font-medium transition-colors"
                  >
                    Details
                  </button>
                  {!ingeschreven && !vol && (
                    <button
                      onClick={() => handleInschrijven(activiteit.id)}
                      disabled={processing === activiteit.id}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
                    >
                      {processing === activiteit.id ? '...' : 'Inschrijven'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="font-heading font-bold text-xl text-pxl-black mb-2">
            Geen activiteiten gevonden
          </h3>
          <p className="text-pxl-black-light">
            {activiteiten.length === 0
              ? 'Er zijn momenteel geen beschikbare activiteiten'
              : 'Geen activiteiten gevonden met de huidige filters'}
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedActiviteit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="font-heading font-bold text-xl text-pxl-black">
                Activiteit Details
              </h2>
              <button
                onClick={() => setSelectedActiviteit(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-6">
              {/* Status badges */}
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium capitalize">
                  {selectedActiviteit.typeActiviteit}
                </span>
                {isIngeschreven(selectedActiviteit.id) && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                    Ingeschreven
                  </span>
                )}
                {!isIngeschreven(selectedActiviteit.id) && isVol(selectedActiviteit) && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                    Volzet
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="font-heading font-bold text-2xl text-pxl-black">
                {selectedActiviteit.titel}
              </h3>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Datum</div>
                  <div className="font-medium">
                    {new Date(selectedActiviteit.datum).toLocaleDateString('nl-BE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tijd</div>
                  <div className="font-medium">
                    {selectedActiviteit.startuur} - {selectedActiviteit.einduur}
                  </div>
                </div>
                {selectedActiviteit.locatie && (
                  <div>
                    <div className="text-sm text-gray-500">Locatie</div>
                    <div className="font-medium">{selectedActiviteit.locatie}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500">Organisator</div>
                  <div className="font-medium">{selectedActiviteit.aangemaaktDoor.naam}</div>
                </div>
                {selectedActiviteit.opleiding && (
                  <div>
                    <div className="text-sm text-gray-500">Opleiding</div>
                    <div className="font-medium">{selectedActiviteit.opleiding.naam}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500">Plaatsen</div>
                  <div className="font-medium">
                    {selectedActiviteit.maxPlaatsen
                      ? `${selectedActiviteit._count.inschrijvingen} / ${selectedActiviteit.maxPlaatsen}`
                      : `${selectedActiviteit._count.inschrijvingen} ingeschreven`}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedActiviteit.omschrijving && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Omschrijving</div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedActiviteit.omschrijving}
                  </p>
                </div>
              )}

              {/* Links */}
              {selectedActiviteit.weblink && (
                <div>
                  <a
                    href={selectedActiviteit.weblink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Meer informatie
                  </a>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setSelectedActiviteit(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 font-medium transition-colors"
              >
                Sluiten
              </button>
              {!isIngeschreven(selectedActiviteit.id) && !isVol(selectedActiviteit) && (
                <button
                  onClick={() => handleInschrijven(selectedActiviteit.id)}
                  disabled={processing === selectedActiviteit.id}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
                >
                  {processing === selectedActiviteit.id ? 'Bezig...' : 'Inschrijven'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
