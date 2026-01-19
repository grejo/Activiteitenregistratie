'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type UrenTargets = {
  urenNiveau1: number
  urenNiveau2: number
  urenNiveau3: number
  urenNiveau4: number
  urenNiveau5: number
  urenDuurzaamheid: number
}

type Opleiding = {
  id: string
  naam: string
  code: string
  beschrijving: string | null
  actief: boolean
  autoGoedkeuringStudentActiviteiten: boolean
  urenTargets: UrenTargets | null
  _count: {
    studenten: number
    docenten: number
    activiteiten: number
  }
}

export default function EditOpleidingForm({
  opleiding,
  schooljaar,
}: {
  opleiding: Opleiding
  schooljaar: string
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState({
    naam: opleiding.naam,
    code: opleiding.code,
    beschrijving: opleiding.beschrijving || '',
    actief: opleiding.actief,
    autoGoedkeuringStudentActiviteiten: opleiding.autoGoedkeuringStudentActiviteiten,
  })
  const [urenTargets, setUrenTargets] = useState<UrenTargets>({
    urenNiveau1: opleiding.urenTargets?.urenNiveau1 ?? 5,
    urenNiveau2: opleiding.urenTargets?.urenNiveau2 ?? 3,
    urenNiveau3: opleiding.urenTargets?.urenNiveau3 ?? 2,
    urenNiveau4: opleiding.urenTargets?.urenNiveau4 ?? 1,
    urenNiveau5: opleiding.urenTargets?.urenNiveau5 ?? 1,
    urenDuurzaamheid: opleiding.urenTargets?.urenDuurzaamheid ?? 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/opleidingen/${opleiding.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          urenTargets,
          schooljaar,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is iets misgegaan')
      }

      router.push('/admin/opleidingen')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleUrenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUrenTargets((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }))
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/opleidingen/${opleiding.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is iets misgegaan')
      }

      router.push('/admin/opleidingen')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const canDelete =
    opleiding._count.studenten === 0 &&
    opleiding._count.docenten === 0 &&
    opleiding._count.activiteiten === 0

  const totaalUren =
    urenTargets.urenNiveau1 +
    urenTargets.urenNiveau2 +
    urenTargets.urenNiveau3 +
    urenTargets.urenNiveau4 +
    urenTargets.urenNiveau5

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="naam" className="block text-sm font-medium text-gray-700">
          Naam *
        </label>
        <input
          type="text"
          id="naam"
          name="naam"
          required
          value={formData.naam}
          onChange={handleChange}
          className="input-field mt-1"
          placeholder="Bv. Bouwkunde"
        />
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
          Code *
        </label>
        <input
          type="text"
          id="code"
          name="code"
          required
          value={formData.code}
          onChange={handleChange}
          className="input-field mt-1"
          placeholder="Bv. BOUW"
        />
        <p className="mt-1 text-sm text-gray-500">
          Unieke code voor de opleiding (meestal in hoofdletters)
        </p>
      </div>

      <div>
        <label htmlFor="beschrijving" className="block text-sm font-medium text-gray-700">
          Beschrijving
        </label>
        <textarea
          id="beschrijving"
          name="beschrijving"
          value={formData.beschrijving}
          onChange={handleChange}
          className="input-field mt-1"
          rows={4}
          placeholder="Optionele beschrijving van de opleiding"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="actief"
            name="actief"
            checked={formData.actief}
            onChange={handleChange}
            className="h-4 w-4 text-pxl-gold focus:ring-pxl-gold border-gray-300 rounded"
          />
          <label htmlFor="actief" className="ml-2 block text-sm text-gray-700">
            Opleiding is actief
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoGoedkeuringStudentActiviteiten"
            name="autoGoedkeuringStudentActiviteiten"
            checked={formData.autoGoedkeuringStudentActiviteiten}
            onChange={handleChange}
            className="h-4 w-4 text-pxl-gold focus:ring-pxl-gold border-gray-300 rounded"
          />
          <label
            htmlFor="autoGoedkeuringStudentActiviteiten"
            className="ml-2 block text-sm text-gray-700"
          >
            Automatische goedkeuring van studentactiviteiten
          </label>
        </div>
      </div>

      {/* Uren Targets Section */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Uren Targets</h3>
        <p className="text-sm text-gray-600 mb-4">
          Stel de minimale uren in die studenten moeten behalen per niveau voor schooljaar{' '}
          <strong>{schooljaar}</strong>.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="urenNiveau1" className="block text-sm font-medium text-gray-700">
              Niveau 1 - Orienteren
            </label>
            <div className="mt-1 relative">
              <input
                type="number"
                id="urenNiveau1"
                name="urenNiveau1"
                min="0"
                step="0.5"
                value={urenTargets.urenNiveau1}
                onChange={handleUrenChange}
                className="input-field pr-12"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-sm">
                uur
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="urenNiveau2" className="block text-sm font-medium text-gray-700">
              Niveau 2 - Kennen
            </label>
            <div className="mt-1 relative">
              <input
                type="number"
                id="urenNiveau2"
                name="urenNiveau2"
                min="0"
                step="0.5"
                value={urenTargets.urenNiveau2}
                onChange={handleUrenChange}
                className="input-field pr-12"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-sm">
                uur
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="urenNiveau3" className="block text-sm font-medium text-gray-700">
              Niveau 3 - Toepassen
            </label>
            <div className="mt-1 relative">
              <input
                type="number"
                id="urenNiveau3"
                name="urenNiveau3"
                min="0"
                step="0.5"
                value={urenTargets.urenNiveau3}
                onChange={handleUrenChange}
                className="input-field pr-12"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-sm">
                uur
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="urenNiveau4" className="block text-sm font-medium text-gray-700">
              Niveau 4 - Integreren
            </label>
            <div className="mt-1 relative">
              <input
                type="number"
                id="urenNiveau4"
                name="urenNiveau4"
                min="0"
                step="0.5"
                value={urenTargets.urenNiveau4}
                onChange={handleUrenChange}
                className="input-field pr-12"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-sm">
                uur
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="urenNiveau5" className="block text-sm font-medium text-gray-700">
              Niveau 5 - Creëren
            </label>
            <div className="mt-1 relative">
              <input
                type="number"
                id="urenNiveau5"
                name="urenNiveau5"
                min="0"
                step="0.5"
                value={urenTargets.urenNiveau5}
                onChange={handleUrenChange}
                className="input-field pr-12"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-sm">
                uur
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="urenDuurzaamheid" className="block text-sm font-medium text-gray-700">
              Duurzaamheidsuren
            </label>
            <div className="mt-1 relative">
              <input
                type="number"
                id="urenDuurzaamheid"
                name="urenDuurzaamheid"
                min="0"
                step="0.5"
                value={urenTargets.urenDuurzaamheid}
                onChange={handleUrenChange}
                className="input-field pr-12"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-sm">
                uur
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Totaal uren (niveau 1-5):</span>
            <span className="text-lg font-bold text-pxl-gold">{totaalUren} uur</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button type="submit" disabled={isLoading} className="btn-primary flex-1">
          {isLoading ? 'Bezig...' : 'Wijzigingen Opslaan'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">
          Annuleren
        </button>
      </div>

      {/* Delete Section */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Gevaarlijke Zone</h3>
        <p className="text-sm text-gray-600 mb-4">
          {canDelete
            ? 'Deze opleiding kan worden verwijderd omdat er geen studenten, docenten of activiteiten aan gekoppeld zijn.'
            : 'Deze opleiding kan niet worden verwijderd omdat er nog data aan gekoppeld is:'}
        </p>

        {!canDelete && (
          <ul className="text-sm text-gray-600 mb-4 list-disc list-inside">
            {opleiding._count.studenten > 0 && <li>{opleiding._count.studenten} student(en)</li>}
            {opleiding._count.docenten > 0 && <li>{opleiding._count.docenten} docent(en)</li>}
            {opleiding._count.activiteiten > 0 && (
              <li>{opleiding._count.activiteiten} activiteit(en)</li>
            )}
          </ul>
        )}

        {showDeleteConfirm ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <p className="text-sm text-red-800 mb-4">
              Weet je zeker dat je <strong>{opleiding.naam}</strong> wilt verwijderen? Deze actie kan
              niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Bezig met verwijderen...' : 'Ja, verwijderen'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Annuleren
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={!canDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Opleiding Verwijderen
          </button>
        )}
      </div>
    </form>
  )
}
