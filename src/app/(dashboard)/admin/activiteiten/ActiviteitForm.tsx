'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Opleiding = {
  id: string
  naam: string
}

type Activiteit = {
  id: string
  titel: string
  typeActiviteit: string
  aard: string | null
  omschrijving: string | null
  datum: Date
  startuur: string
  einduur: string
  locatie: string | null
  weblink: string | null
  organisatorPxl: string | null
  organisatorExtern: string | null
  bewijslink: string | null
  verplichtProfiel: string | null
  maxPlaatsen: number | null
  status: string
  typeAanvraag: string
  opleidingId: string | null
}

export default function ActiviteitForm({
  activiteit,
  opleidingen,
}: {
  activiteit?: Activiteit
  opleidingen: Opleiding[]
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!activiteit

  const [formData, setFormData] = useState({
    titel: activiteit?.titel || '',
    typeActiviteit: activiteit?.typeActiviteit || 'workshop',
    aard: activiteit?.aard || '',
    omschrijving: activiteit?.omschrijving || '',
    datum: activiteit
      ? new Date(activiteit.datum).toISOString().split('T')[0]
      : '',
    startuur: activiteit?.startuur || '09:00',
    einduur: activiteit?.einduur || '17:00',
    locatie: activiteit?.locatie || '',
    weblink: activiteit?.weblink || '',
    organisatorPxl: activiteit?.organisatorPxl || '',
    organisatorExtern: activiteit?.organisatorExtern || '',
    bewijslink: activiteit?.bewijslink || '',
    verplichtProfiel: activiteit?.verplichtProfiel || '',
    maxPlaatsen: activiteit?.maxPlaatsen || null,
    status: activiteit?.status || 'gepubliceerd',
    opleidingId: activiteit?.opleidingId || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = isEditing
        ? `/api/admin/activiteiten/${activiteit.id}`
        : '/api/admin/activiteiten'

      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
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

      router.push('/admin/activiteiten')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
    } finally {
      setIsLoading(false)
    }
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          className="input-field mt-1"
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
            className="input-field mt-1"
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
            className="input-field mt-1"
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
          className="input-field mt-1"
          rows={4}
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
            className="input-field mt-1"
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
            className="input-field mt-1"
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
            className="input-field mt-1"
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
            className="input-field mt-1"
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
            className="input-field mt-1"
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
            className="input-field mt-1"
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
            className="input-field mt-1"
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
            className="input-field mt-1"
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
            className="input-field mt-1"
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
          className="input-field mt-1"
        >
          <option value="concept">Concept</option>
          <option value="gepubliceerd">Gepubliceerd</option>
          <option value="in_review">In behandeling</option>
          <option value="goedgekeurd">Goedgekeurd</option>
          <option value="afgekeurd">Afgekeurd</option>
          <option value="afgerond">Afgerond</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <button type="submit" disabled={isLoading} className="btn-primary flex-1">
          {isLoading
            ? 'Bezig...'
            : isEditing
            ? 'Wijzigingen Opslaan'
            : 'Activiteit Aanmaken'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary flex-1"
        >
          Annuleren
        </button>
      </div>
    </form>
  )
}
