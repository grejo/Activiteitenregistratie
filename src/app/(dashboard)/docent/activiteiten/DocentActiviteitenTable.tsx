'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Activiteit = {
  id: string
  titel: string
  omschrijving: string | null
  datum: string
  status: string
  typeActiviteit: string
  maxPlaatsen: number | null
  opleiding: {
    naam: string
  } | null
  inschrijvingen: {
    id: string
    student: {
      naam: string
    }
    effectieveDeelname: boolean
  }[]
}

type Opleiding = {
  id: string
  naam: string
}

const statusLabels: Record<string, string> = {
  concept: 'Concept',
  gepubliceerd: 'Gepubliceerd',
  in_review: 'In behandeling',
  goedgekeurd: 'Goedgekeurd',
  afgekeurd: 'Afgekeurd',
  afgerond: 'Afgerond',
}

const statusColors: Record<string, string> = {
  concept: 'bg-gray-100 text-gray-800',
  gepubliceerd: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  goedgekeurd: 'bg-green-100 text-green-800',
  afgekeurd: 'bg-red-100 text-red-800',
  afgerond: 'bg-purple-100 text-purple-800',
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
  verplichtProfiel: '',
  maxPlaatsen: null as number | null,
  status: 'gepubliceerd',
  opleidingId: '',
}

export default function DocentActiviteitenTable({
  activiteiten,
  opleidingen,
}: {
  activiteiten: Activiteit[]
  opleidingen: Opleiding[]
}) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState(initialFormData)

  // Filter activiteiten based on selected filters
  const filteredActiviteiten = useMemo(() => {
    let filtered = activiteiten

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.titel.toLowerCase().includes(query) ||
          a.omschrijving?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [activiteiten, statusFilter, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    const upcoming = activiteiten.filter(
      (a) => new Date(a.datum) >= new Date() && a.status === 'gepubliceerd'
    ).length
    const totalInschrijvingen = activiteiten.reduce(
      (sum, a) => sum + a.inschrijvingen.length,
      0
    )
    const past = activiteiten.filter(
      (a) => new Date(a.datum) < new Date()
    ).length

    return { upcoming, totalInschrijvingen, past, total: activiteiten.length }
  }, [activiteiten])

  const openModal = () => {
    setFormData(initialFormData)
    setError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData(initialFormData)
    setError(null)
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/docent/activiteiten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxPlaatsen: formData.maxPlaatsen ? Number(formData.maxPlaatsen) : null,
          opleidingId: formData.opleidingId || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is iets misgegaan')
      }

      closeModal()
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
            Mijn Activiteiten
          </h1>
          <p className="text-pxl-black-light mt-4">
            Overzicht van alle activiteiten die je hebt aangemaakt
          </p>
        </div>
        <button onClick={openModal} className="btn-primary">
          + Nieuwe Activiteit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Totaal</div>
          <div className="text-2xl font-bold text-pxl-gold">{stats.total}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Komende</div>
          <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Afgelopen</div>
          <div className="text-2xl font-bold text-gray-600">{stats.past}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Totaal Inschrijvingen</div>
          <div className="text-2xl font-bold text-green-600">
            {stats.totalInschrijvingen}
          </div>
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
              <option value="concept">Concept</option>
              <option value="gepubliceerd">Gepubliceerd</option>
              <option value="in_review">In behandeling</option>
              <option value="goedgekeurd">Goedgekeurd</option>
              <option value="afgekeurd">Afgekeurd</option>
              <option value="afgerond">Afgerond</option>
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

      {/* Activities Table */}
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
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opleiding
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inschrijvingen
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredActiviteiten.map((activiteit) => {
                const isPast = new Date(activiteit.datum) < new Date()
                return (
                  <tr key={activiteit.id} className={isPast ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(activiteit.datum).toLocaleDateString('nl-BE')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{activiteit.titel}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {activiteit.omschrijving}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {activiteit.typeActiviteit}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activiteit.opleiding?.naam || 'Alle'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {activiteit.inschrijvingen.length}
                        {activiteit.maxPlaatsen && ` / ${activiteit.maxPlaatsen}`}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusColors[activiteit.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[activiteit.status] || activiteit.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/docent/activiteiten/${activiteit.id}/edit`}
                          className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 font-medium transition-colors"
                        >
                          Bewerken
                        </Link>
                        <Link
                          href={`/docent/activiteiten/${activiteit.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-pxl-gold text-pxl-gold rounded hover:bg-yellow-50 font-medium transition-colors"
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredActiviteiten.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="font-heading font-bold text-xl text-pxl-black mb-2">
            Geen activiteiten gevonden
          </h3>
          <p className="text-pxl-black-light mb-4">
            {activiteiten.length === 0
              ? 'Je hebt nog geen activiteiten aangemaakt'
              : 'Geen activiteiten gevonden met de huidige filters'}
          </p>
          {activiteiten.length === 0 && (
            <button onClick={openModal} className="btn-primary">
              Maak je eerste activiteit
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="font-heading font-bold text-xl text-pxl-black">
                Nieuwe Activiteit
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
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
                  <label
                    htmlFor="typeActiviteit"
                    className="block text-sm font-medium text-gray-700"
                  >
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
                <label
                  htmlFor="omschrijving"
                  className="block text-sm font-medium text-gray-700"
                >
                  Omschrijving
                </label>
                <textarea
                  id="omschrijving"
                  name="omschrijving"
                  value={formData.omschrijving}
                  onChange={handleChange}
                  className="input-field mt-1 w-full"
                  rows={3}
                  placeholder="Beschrijving van de activiteit"
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
                  <label
                    htmlFor="startuur"
                    className="block text-sm font-medium text-gray-700"
                  >
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
                  <label
                    htmlFor="organisatorPxl"
                    className="block text-sm font-medium text-gray-700"
                  >
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
                  <label
                    htmlFor="organisatorExtern"
                    className="block text-sm font-medium text-gray-700"
                  >
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

              {/* Opleiding & Max Plaatsen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="opleidingId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Opleiding
                  </label>
                  <select
                    id="opleidingId"
                    name="opleidingId"
                    value={formData.opleidingId}
                    onChange={handleChange}
                    className="input-field mt-1 w-full"
                  >
                    <option value="">Alle opleidingen</option>
                    {opleidingen.map((opleiding) => (
                      <option key={opleiding.id} value={opleiding.id}>
                        {opleiding.naam}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="maxPlaatsen"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Max Plaatsen
                  </label>
                  <input
                    type="number"
                    id="maxPlaatsen"
                    name="maxPlaatsen"
                    min="0"
                    value={formData.maxPlaatsen || ''}
                    onChange={handleChange}
                    className="input-field mt-1 w-full"
                    placeholder="Laat leeg voor onbeperkt"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-field mt-1 w-full"
                >
                  <option value="concept">Concept</option>
                  <option value="gepubliceerd">Gepubliceerd</option>
                  <option value="afgerond">Afgerond</option>
                </select>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t -mx-6 px-6 py-4 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 font-medium transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-pxl-gold text-white rounded hover:bg-pxl-gold-dark font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Bezig...' : 'Activiteit Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
