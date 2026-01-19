'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BewijsstukkenUpload from '@/components/bewijsstukken/BewijsstukkenUpload'

type Bewijsstuk = {
  id: string
  type: string
  bestandsnaam: string
  bestandspad: string
  uploadedAt: string
}

type Aanvraag = {
  id: string
  titel: string
  omschrijving: string | null
  datum: string
  startuur: string
  einduur: string
  locatie: string | null
  weblink: string | null
  typeActiviteit: string
  aard: string | null
  status: string
  opmerkingen: string | null
  bewijslink: string | null
  organisatorPxl: string | null
  organisatorExtern: string | null
  createdAt: string
  opleiding: {
    naam: string
  } | null
}

const statusLabels: Record<string, string> = {
  concept: 'Concept',
  in_review: 'In behandeling',
  goedgekeurd: 'Goedgekeurd',
  afgekeurd: 'Afgekeurd',
}

const statusColors: Record<string, string> = {
  concept: 'bg-gray-100 text-gray-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  goedgekeurd: 'bg-green-100 text-green-800',
  afgekeurd: 'bg-red-100 text-red-800',
}

const initialFormData = {
  titel: '',
  typeActiviteit: 'workshop',
  aard: '',
  omschrijving: '',
  datum: '',
  startuur: '09:00',
  einduur: '17:00',
  locatie: '',
  weblink: '',
  organisatorPxl: '',
  organisatorExtern: '',
  bewijslink: '',
}

export default function AanvragenTable({
  aanvragen,
}: {
  aanvragen: Aanvraag[]
}) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAanvraag, setSelectedAanvraag] = useState<Aanvraag | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [bewijsstukken, setBewijsstukken] = useState<Bewijsstuk[]>([])
  const [loadingBewijsstukken, setLoadingBewijsstukken] = useState(false)

  const filteredAanvragen = useMemo(() => {
    let filtered = aanvragen

    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.titel.toLowerCase().includes(query) ||
          a.omschrijving?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [aanvragen, statusFilter, searchQuery])

  const stats = useMemo(() => {
    const inReview = aanvragen.filter((a) => a.status === 'in_review').length
    const goedgekeurd = aanvragen.filter((a) => a.status === 'goedgekeurd').length
    const afgekeurd = aanvragen.filter((a) => a.status === 'afgekeurd').length

    return { totaal: aanvragen.length, inReview, goedgekeurd, afgekeurd }
  }, [aanvragen])

  // Fetch bewijsstukken when a aanvraag is selected
  const fetchBewijsstukken = useCallback(async (activiteitId: string) => {
    setLoadingBewijsstukken(true)
    try {
      const response = await fetch(`/api/bewijsstukken?activiteitId=${activiteitId}`)
      if (response.ok) {
        const data = await response.json()
        setBewijsstukken(data)
      } else {
        setBewijsstukken([])
      }
    } catch {
      setBewijsstukken([])
    } finally {
      setLoadingBewijsstukken(false)
    }
  }, [])

  useEffect(() => {
    if (selectedAanvraag) {
      fetchBewijsstukken(selectedAanvraag.id)
    } else {
      setBewijsstukken([])
    }
  }, [selectedAanvraag, fetchBewijsstukken])

  const handleBewijsstukkenUpdate = () => {
    if (selectedAanvraag) {
      fetchBewijsstukken(selectedAanvraag.id)
    }
  }

  const openNewModal = () => {
    setFormData(initialFormData)
    setError(null)
    setShowNewModal(true)
  }

  const closeNewModal = () => {
    setShowNewModal(false)
    setFormData(initialFormData)
    setError(null)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/student/aanvragen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is iets misgegaan')
      }

      closeNewModal()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
            Mijn Aanvragen
          </h1>
          <p className="text-pxl-black-light mt-4">
            Overzicht van je aangevraagde activiteiten
          </p>
        </div>
        <button onClick={openNewModal} className="btn-primary">
          + Nieuwe Aanvraag
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Totaal</div>
          <div className="text-2xl font-bold text-pxl-gold">{stats.totaal}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">In behandeling</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.inReview}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Goedgekeurd</div>
          <div className="text-2xl font-bold text-green-600">{stats.goedgekeurd}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Afgekeurd</div>
          <div className="text-2xl font-bold text-red-600">{stats.afgekeurd}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Zoek op titel of omschrijving..."
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
              <option value="in_review">In behandeling</option>
              <option value="goedgekeurd">Goedgekeurd</option>
              <option value="afgekeurd">Afgekeurd</option>
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
      {filteredAanvragen.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aangevraagd op
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activiteit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAanvragen.map((aanvraag) => (
                  <tr key={aanvraag.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(aanvraag.createdAt).toLocaleDateString('nl-BE')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{aanvraag.titel}</div>
                      <div className="text-sm text-gray-500 capitalize">
                        {aanvraag.typeActiviteit}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(aanvraag.datum).toLocaleDateString('nl-BE')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusColors[aanvraag.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[aanvraag.status] || aanvraag.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedAanvraag(aanvraag)}
                        className="inline-flex items-center px-3 py-1.5 border border-pxl-gold text-pxl-gold rounded hover:bg-yellow-50 font-medium transition-colors"
                      >
                        Details
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
          <div className="text-4xl mb-4">📝</div>
          <h3 className="font-heading font-bold text-xl text-pxl-black mb-2">
            Geen aanvragen gevonden
          </h3>
          <p className="text-pxl-black-light mb-4">
            {aanvragen.length === 0
              ? 'Je hebt nog geen activiteiten aangevraagd'
              : 'Geen aanvragen gevonden met de huidige filters'}
          </p>
          {aanvragen.length === 0 && (
            <button onClick={openNewModal} className="btn-primary">
              Vraag je eerste activiteit aan
            </button>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAanvraag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="font-heading font-bold text-xl text-pxl-black">
                Aanvraag Details
              </h2>
              <button
                onClick={() => setSelectedAanvraag(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    statusColors[selectedAanvraag.status] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {statusLabels[selectedAanvraag.status] || selectedAanvraag.status}
                </span>
                <span className="text-sm text-gray-500">
                  Aangevraagd op {new Date(selectedAanvraag.createdAt).toLocaleDateString('nl-BE')}
                </span>
              </div>

              {/* Feedback bij afkeuring */}
              {selectedAanvraag.status === 'afgekeurd' && selectedAanvraag.opmerkingen && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-red-800 mb-1">Feedback docent:</div>
                  <p className="text-red-700">{selectedAanvraag.opmerkingen}</p>
                </div>
              )}

              {/* Activity Details */}
              <div>
                <h3 className="font-heading font-bold text-xl text-pxl-black mb-4">
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
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedAanvraag.omschrijving}
                    </p>
                  </div>
                )}

                {/* Organisator */}
                {(selectedAanvraag.organisatorPxl || selectedAanvraag.organisatorExtern) && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Organisator</div>
                    {selectedAanvraag.organisatorPxl && (
                      <div className="text-sm">
                        <span className="font-medium">PXL:</span> {selectedAanvraag.organisatorPxl}
                      </div>
                    )}
                    {selectedAanvraag.organisatorExtern && (
                      <div className="text-sm">
                        <span className="font-medium">Extern:</span>{' '}
                        {selectedAanvraag.organisatorExtern}
                      </div>
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

              {/* Bewijsstukken Section */}
              <div className="border-t pt-6">
                <h4 className="font-heading font-bold text-lg text-pxl-black mb-4">
                  Bewijsstukken
                </h4>
                {loadingBewijsstukken ? (
                  <div className="text-center py-4">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-pxl-gold border-t-transparent rounded-full" />
                    <p className="text-sm text-gray-500 mt-2">Bewijsstukken laden...</p>
                  </div>
                ) : (
                  <BewijsstukkenUpload
                    activiteitId={selectedAanvraag.id}
                    bewijsstukken={bewijsstukken}
                    canUpload={selectedAanvraag.status !== 'afgekeurd'}
                    canDelete={selectedAanvraag.status !== 'afgekeurd'}
                    onUpdate={handleBewijsstukkenUpdate}
                  />
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedAanvraag(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 font-medium transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Aanvraag Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="font-heading font-bold text-xl text-pxl-black">
                Nieuwe Activiteit Aanvragen
              </h2>
              <button
                onClick={closeNewModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Titel */}
              <div>
                <label htmlFor="titel" className="block text-sm font-medium text-gray-700">
                  Titel *
                </label>
                <input
                  type="text"
                  id="titel"
                  name="titel"
                  required
                  value={formData.titel}
                  onChange={handleChange}
                  className="input-field mt-1 w-full"
                  placeholder="Naam van de activiteit"
                />
              </div>

              {/* Type & Aard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="typeActiviteit" className="block text-sm font-medium text-gray-700">
                    Type Activiteit *
                  </label>
                  <select
                    id="typeActiviteit"
                    name="typeActiviteit"
                    required
                    value={formData.typeActiviteit}
                    onChange={handleChange}
                    className="input-field mt-1 w-full"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="lezing">Lezing</option>
                    <option value="excursie">Excursie</option>
                    <option value="project">Project</option>
                    <option value="event">Event</option>
                    <option value="training">Training</option>
                    <option value="conferentie">Conferentie</option>
                    <option value="vrijwilligerswerk">Vrijwilligerswerk</option>
                    <option value="andere">Andere</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="aard" className="block text-sm font-medium text-gray-700">
                    Aard
                  </label>
                  <input
                    type="text"
                    id="aard"
                    name="aard"
                    value={formData.aard}
                    onChange={handleChange}
                    className="input-field mt-1 w-full"
                    placeholder="Bv. fysiek, online, hybride"
                  />
                </div>
              </div>

              {/* Omschrijving */}
              <div>
                <label htmlFor="omschrijving" className="block text-sm font-medium text-gray-700">
                  Omschrijving *
                </label>
                <textarea
                  id="omschrijving"
                  name="omschrijving"
                  required
                  value={formData.omschrijving}
                  onChange={handleChange}
                  className="input-field mt-1 w-full"
                  rows={3}
                  placeholder="Beschrijf de activiteit en wat je hebt geleerd/gedaan"
                />
              </div>

              {/* Datum & Tijd */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="datum" className="block text-sm font-medium text-gray-700">
                    Datum *
                  </label>
                  <input
                    type="date"
                    id="datum"
                    name="datum"
                    required
                    value={formData.datum}
                    onChange={handleChange}
                    className="input-field mt-1 w-full"
                  />
                </div>

                <div>
                  <label htmlFor="startuur" className="block text-sm font-medium text-gray-700">
                    Startuur *
                  </label>
                  <input
                    type="time"
                    id="startuur"
                    name="startuur"
                    required
                    value={formData.startuur}
                    onChange={handleChange}
                    className="input-field mt-1 w-full"
                  />
                </div>

                <div>
                  <label htmlFor="einduur" className="block text-sm font-medium text-gray-700">
                    Einduur *
                  </label>
                  <input
                    type="time"
                    id="einduur"
                    name="einduur"
                    required
                    value={formData.einduur}
                    onChange={handleChange}
                    className="input-field mt-1 w-full"
                  />
                </div>
              </div>

              {/* Locatie & Weblink */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="locatie" className="block text-sm font-medium text-gray-700">
                    Locatie
                  </label>
                  <input
                    type="text"
                    id="locatie"
                    name="locatie"
                    value={formData.locatie}
                    onChange={handleChange}
                    className="input-field mt-1 w-full"
                    placeholder="Adres of locatie"
                  />
                </div>

                <div>
                  <label htmlFor="weblink" className="block text-sm font-medium text-gray-700">
                    Weblink
                  </label>
                  <input
                    type="url"
                    id="weblink"
                    name="weblink"
                    value={formData.weblink}
                    onChange={handleChange}
                    className="input-field mt-1 w-full"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Organisatoren */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="organisatorPxl" className="block text-sm font-medium text-gray-700">
                    Organisator PXL
                  </label>
                  <input
                    type="text"
                    id="organisatorPxl"
                    name="organisatorPxl"
                    value={formData.organisatorPxl}
                    onChange={handleChange}
                    className="input-field mt-1 w-full"
                    placeholder="Naam PXL organisator"
                  />
                </div>

                <div>
                  <label htmlFor="organisatorExtern" className="block text-sm font-medium text-gray-700">
                    Organisator Extern
                  </label>
                  <input
                    type="text"
                    id="organisatorExtern"
                    name="organisatorExtern"
                    value={formData.organisatorExtern}
                    onChange={handleChange}
                    className="input-field mt-1 w-full"
                    placeholder="Naam externe organisator"
                  />
                </div>
              </div>

              {/* Bewijslink */}
              <div>
                <label htmlFor="bewijslink" className="block text-sm font-medium text-gray-700">
                  Bewijslink (optioneel)
                </label>
                <input
                  type="url"
                  id="bewijslink"
                  name="bewijslink"
                  value={formData.bewijslink}
                  onChange={handleChange}
                  className="input-field mt-1 w-full"
                  placeholder="Link naar bewijs (foto, certificaat, etc.)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Voeg een link toe naar bewijs van je deelname (bv. foto, certificaat, LinkedIn post)
                </p>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t -mx-6 px-6 py-4 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeNewModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 font-medium transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-pxl-gold text-white rounded hover:bg-pxl-gold-dark font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Bezig...' : 'Aanvraag Indienen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
