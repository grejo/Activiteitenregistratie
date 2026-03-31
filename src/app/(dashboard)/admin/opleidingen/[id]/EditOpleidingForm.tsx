'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BEENTJES, BEENTJE_LABELS, NIVEAUS, BEENTJE_VEREIST_VELD } from '@/lib/beentjes'

type OpleidingTargets = {
  doelNiveau1: number
  doelNiveau2: number
  doelNiveau3: number
  doelNiveau4: number
  passieVereist: boolean
  ondernemendVereist: boolean
  samenwerkingVereist: boolean
  multidisciplinairVereist: boolean
  reflectieVereist: boolean
  duurzaamheidVereist: boolean
}

type Opleiding = {
  id: string
  naam: string
  code: string
  beschrijving: string | null
  actief: boolean
  autoGoedkeuringStudentActiviteiten: boolean
  targets: OpleidingTargets | null
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

  const [targets, setTargets] = useState<OpleidingTargets>({
    doelNiveau1: opleiding.targets?.doelNiveau1 ?? 0,
    doelNiveau2: opleiding.targets?.doelNiveau2 ?? 0,
    doelNiveau3: opleiding.targets?.doelNiveau3 ?? 0,
    doelNiveau4: opleiding.targets?.doelNiveau4 ?? 0,
    passieVereist: opleiding.targets?.passieVereist ?? false,
    ondernemendVereist: opleiding.targets?.ondernemendVereist ?? false,
    samenwerkingVereist: opleiding.targets?.samenwerkingVereist ?? false,
    multidisciplinairVereist: opleiding.targets?.multidisciplinairVereist ?? false,
    reflectieVereist: opleiding.targets?.reflectieVereist ?? false,
    duurzaamheidVereist: opleiding.targets?.duurzaamheidVereist ?? false,
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
          targets,
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

      {/* Activiteiten Targets */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Activiteiten Targets</h3>
        <p className="text-sm text-gray-600 mb-6">
          Targets voor schooljaar <strong>{schooljaar}</strong>.
        </p>

        {/* Doelen per niveau */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Totaal vereiste activiteiten per niveau <span className="font-normal text-gray-500">(over alle beentjes heen)</span>
          </h4>
          <div className="grid grid-cols-4 gap-3 max-w-sm">
            {NIVEAUS.map((n) => {
              const veld = `doelNiveau${n}` as keyof OpleidingTargets
              return (
                <div key={n} className="text-center">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Niveau {n}</label>
                  <input
                    type="number"
                    min="0"
                    value={targets[veld] as number}
                    onChange={(e) =>
                      setTargets((prev) => ({ ...prev, [veld]: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full text-center input-field py-1 px-2 text-sm"
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Vereiste beentjes */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Vereiste beentjes <span className="font-normal text-gray-500">(student moet minstens 1 activiteit behalen)</span>
          </h4>
          <div className="space-y-2">
            {BEENTJES.map((beentje) => {
              const veld = BEENTJE_VEREIST_VELD[beentje] as keyof OpleidingTargets
              return (
                <label key={beentje} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targets[veld] as boolean}
                    onChange={(e) =>
                      setTargets((prev) => ({ ...prev, [veld]: e.target.checked }))
                    }
                    className="w-4 h-4 text-pxl-gold focus:ring-pxl-gold border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{BEENTJE_LABELS[beentje]}</span>
                </label>
              )
            })}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={targets.duurzaamheidVereist}
                onChange={(e) =>
                  setTargets((prev) => ({ ...prev, duurzaamheidVereist: e.target.checked }))
                }
                className="w-4 h-4 text-pxl-gold focus:ring-pxl-gold border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Duurzaamheid</span>
            </label>
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
              Weet je zeker dat je <strong>{opleiding.naam}</strong> wilt verwijderen? Deze actie
              kan niet ongedaan worden gemaakt.
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
