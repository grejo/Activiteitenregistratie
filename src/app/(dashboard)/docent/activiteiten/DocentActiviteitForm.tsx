'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NIVEAUS, NIVEAU_LABELS } from '@/lib/beentjes'

type Opleiding = {
  id: string
  naam: string
  niveau1Beschrijving?: string | null
  niveau2Beschrijving?: string | null
  niveau3Beschrijving?: string | null
  niveau4Beschrijving?: string | null
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
  organisator: string | null
  organisatorPxl?: string | null
  organisatorExtern?: string | null
  aftekenlijstVereist?: boolean
  verplicht?: boolean
  bewijslink: string | null
  verplichtProfiel: string | null
  maxPlaatsen: number | null
  niveau: number | null
  status: string
  typeAanvraag: string
  opleidingId: string | null
  verwittigPerMail?: boolean
  opleidingen?: { opleidingId: string }[]
}

export default function DocentActiviteitForm({
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
    organisator:
      activiteit?.organisator ||
      [activiteit?.organisatorPxl, activiteit?.organisatorExtern]
        .filter(Boolean)
        .join(' / ') ||
      '',
    bewijslink: activiteit?.bewijslink || '',
    verplichtProfiel: activiteit?.verplichtProfiel || '',
    maxPlaatsen: activiteit?.maxPlaatsen || null,
    status: activiteit?.status || 'gepubliceerd',
    opleidingId: activiteit?.opleidingId || '',
    niveau: activiteit?.niveau?.toString() || '',
    aftekenlijstVereist: activiteit?.aftekenlijstVereist ?? false,
    verplicht: activiteit?.verplicht ?? false,
  })

  // Mail-verwittiging (standaard uit) — docent beslist of studenten gemaild worden
  const [verwittigPerMail, setVerwittigPerMail] = useState<boolean>(
    activiteit?.verwittigPerMail ?? false
  )

  // Extra opleidingen waarvoor de activiteit óók zichtbaar is (naast de primaire).
  const [extraOpleidingIds, setExtraOpleidingIds] = useState<string[]>(
    (activiteit?.opleidingen || [])
      .map((o) => o.opleidingId)
      .filter((id) => id !== activiteit?.opleidingId)
  )
  const toggleExtraOpleiding = (id: string) =>
    setExtraOpleidingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = isEditing
        ? `/api/docent/activiteiten/${activiteit.id}`
        : '/api/docent/activiteiten'

      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxPlaatsen: formData.maxPlaatsen ? Number(formData.maxPlaatsen) : null,
          opleidingId: formData.opleidingId,
          opleidingIds: Array.from(
            new Set([formData.opleidingId, ...extraOpleidingIds].filter(Boolean))
          ),
          niveau: formData.niveau ? Number(formData.niveau) : null,
          verwittigPerMail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is iets misgegaan')
      }

      router.push('/docent/activiteiten')
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

      {/* Organisator */}
      <div>
        <label
          htmlFor="organisator"
          className="block text-sm font-medium text-gray-700"
        >
          Organisator
        </label>
        <input
          type="text"
          id="organisator"
          name="organisator"
          value={formData.organisator}
          onChange={handleChange}
          className="input-field mt-1"
          placeholder="Naam van de organisator (PXL of extern)"
        />
      </div>

      {/* Opleiding & Niveau */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="opleidingId"
            className="block text-sm font-medium text-gray-700"
          >
            Opleiding *
          </label>
          <select
            id="opleidingId"
            name="opleidingId"
            required
            value={formData.opleidingId}
            onChange={handleChange}
            className="input-field mt-1"
          >
            <option value="" disabled>— Kies een opleiding —</option>
            {opleidingen.map((opleiding) => (
              <option key={opleiding.id} value={opleiding.id}>
                {opleiding.naam}
              </option>
            ))}
          </select>

          {/* Cross-opleiding: ook tonen bij andere opleidingen */}
          {opleidingen.filter((o) => o.id !== formData.opleidingId).length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700">
                Ook tonen op het prikbord van:
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Standaard verschijnt de activiteit enkel bij de gekozen opleiding hierboven.
              </p>
              <div className="space-y-1 border border-gray-200 rounded p-2 max-h-40 overflow-y-auto">
                {opleidingen
                  .filter((o) => o.id !== formData.opleidingId)
                  .map((o) => (
                    <label key={o.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={extraOpleidingIds.includes(o.id)}
                        onChange={() => toggleExtraOpleiding(o.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{o.naam}</span>
                    </label>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {(() => {
            const gekozenOpleiding = opleidingen.find((o) => o.id === formData.opleidingId)
            const niveauNr = formData.niveau ? Number(formData.niveau) : null
            const veld = niveauNr
              ? (`niveau${niveauNr}Beschrijving` as keyof Opleiding)
              : null
            const beschrijving =
              gekozenOpleiding && veld ? (gekozenOpleiding[veld] as string | null) : null
            return (
              <>
                <label
                  htmlFor="niveau"
                  className="flex items-center gap-1 text-sm font-medium text-gray-700"
                >
                  Niveau *
                  {beschrijving && (
                    <span
                      title={beschrijving}
                      className="cursor-help text-gray-400"
                      aria-label="Opleidingsspecifieke omschrijving van dit niveau"
                    >
                      ⓘ
                    </span>
                  )}
                </label>
                <select
                  id="niveau"
                  name="niveau"
                  required
                  value={formData.niveau}
                  onChange={handleChange}
                  className="input-field mt-1"
                >
                  <option value="" disabled>— Kies een niveau —</option>
                  {NIVEAUS.map((n) => (
                    <option key={n} value={n}>
                      {NIVEAU_LABELS[n]}
                    </option>
                  ))}
                </select>
                {beschrijving && (
                  <p className="mt-1 text-xs text-gray-500">{beschrijving}</p>
                )}
              </>
            )
          })()}
        </div>
      </div>

      {/* Max Plaatsen */}
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
          <option value="afgerond">Afgerond</option>
        </select>
      </div>

      {/* Vinkjes: aftekenlijst + verplicht */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.aftekenlijstVereist}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, aftekenlijstVereist: e.target.checked }))
            }
            className="mt-1"
          />
          <div>
            <div className="text-sm font-medium">Aftekenlijst gebruiken</div>
            <div className="text-xs text-gray-600">
              Toon de knop om een PDF-aftekendocument te downloaden op de detailpagina.
            </div>
          </div>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.verplicht}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, verplicht: e.target.checked }))
            }
            className="mt-1"
          />
          <div>
            <div className="text-sm font-medium">Verplichte activiteit</div>
            <div className="text-xs text-gray-600">
              Verschijnt met een badge op scorekaart en prikbord.
            </div>
          </div>
        </label>
      </div>

      {/* Mail-verwittiging */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={verwittigPerMail}
            onChange={(e) => setVerwittigPerMail(e.target.checked)}
            className="mt-0.5 h-4 w-4 text-pxl-gold focus:ring-pxl-gold border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">
            <span className="font-medium">Studenten per e-mail verwittigen</span>
            <br />
            Bij publicatie krijgen alle studenten van de gekozen opleiding(en) een e-mail.
            Standaard uit — vink aan als je wil verwittigen.
          </span>
        </label>
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
