'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  aantalIngeschreven: number
  status: string
  opmerkingen: string | null
  typeAanvraag: string
  aangemaaktDoor: {
    id: string
    naam: string
    email: string
    role: string
    opleiding: {
      naam: string
    } | null
  }
  opleiding: {
    naam: string
  } | null
  duurzaamheid: Array<{
    duurzaamheid: {
      naam: string
    }
  }>
  inschrijvingen: Array<{
    id: string
    student: {
      naam: string
      email: string
      opleiding: {
        naam: string
      } | null
    }
  }>
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

export default function ActiviteitDetails({ activiteit }: { activiteit: Activiteit }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [opmerking, setOpmerking] = useState('')

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/admin/activiteiten/${activiteit.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          opmerkingen: opmerking || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is iets misgegaan')
      }

      setSuccess(`Status gewijzigd naar: ${statusLabels[newStatus]}`)
      setOpmerking('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/activiteiten/${activiteit.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is iets misgegaan')
      }

      router.push('/admin/activiteiten')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Status & Actions */}
      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-heading font-bold text-xl mb-2">{activiteit.titel}</h2>
            <span
              className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                statusColors[activiteit.status] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {statusLabels[activiteit.status] || activiteit.status}
            </span>
          </div>
          <Link href="/admin/activiteiten" className="btn-secondary">
            ← Terug
          </Link>
        </div>

        {/* Quick Actions */}
        {activiteit.status === 'in_review' && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-3">Status Wijzigen</h3>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opmerking (optioneel)
              </label>
              <textarea
                value={opmerking}
                onChange={(e) => setOpmerking(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Voeg eventueel een opmerking toe..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleStatusChange('goedgekeurd')}
                disabled={isLoading}
                className="btn-primary"
              >
                ✓ Goedkeuren
              </button>
              <button
                onClick={() => handleStatusChange('afgekeurd')}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                ✗ Afkeuren
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="card">
        <h3 className="font-heading font-bold text-lg mb-4">Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Type Activiteit</span>
            <p className="text-gray-900">{activiteit.typeActiviteit}</p>
          </div>

          {activiteit.aard && (
            <div>
              <span className="text-sm font-medium text-gray-500">Aard</span>
              <p className="text-gray-900">{activiteit.aard}</p>
            </div>
          )}

          <div>
            <span className="text-sm font-medium text-gray-500">Datum</span>
            <p className="text-gray-900">
              {new Date(activiteit.datum).toLocaleDateString('nl-BE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-500">Tijd</span>
            <p className="text-gray-900">
              {activiteit.startuur} - {activiteit.einduur}
            </p>
          </div>

          {activiteit.locatie && (
            <div>
              <span className="text-sm font-medium text-gray-500">Locatie</span>
              <p className="text-gray-900">{activiteit.locatie}</p>
            </div>
          )}

          {activiteit.opleiding && (
            <div>
              <span className="text-sm font-medium text-gray-500">Opleiding</span>
              <p className="text-gray-900">{activiteit.opleiding.naam}</p>
            </div>
          )}

          <div>
            <span className="text-sm font-medium text-gray-500">Type Aanvraag</span>
            <p className="text-gray-900 capitalize">{activiteit.typeAanvraag}</p>
          </div>

          {activiteit.maxPlaatsen && (
            <div>
              <span className="text-sm font-medium text-gray-500">Plaatsen</span>
              <p className="text-gray-900">
                {activiteit.inschrijvingen.length} / {activiteit.maxPlaatsen}
              </p>
            </div>
          )}
        </div>

        {activiteit.omschrijving && (
          <div className="mt-4 pt-4 border-t">
            <span className="text-sm font-medium text-gray-500">Omschrijving</span>
            <p className="text-gray-900 mt-1 whitespace-pre-wrap">
              {activiteit.omschrijving}
            </p>
          </div>
        )}

        {activiteit.duurzaamheid.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <span className="text-sm font-medium text-gray-500">Duurzaamheidsthema's</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {activiteit.duurzaamheid.map((dt, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                >
                  {dt.duurzaamheid.naam}
                </span>
              ))}
            </div>
          </div>
        )}

        {activiteit.opmerkingen && (
          <div className="mt-4 pt-4 border-t">
            <span className="text-sm font-medium text-gray-500">Opmerkingen</span>
            <p className="text-gray-900 mt-1 whitespace-pre-wrap">
              {activiteit.opmerkingen}
            </p>
          </div>
        )}
      </div>

      {/* Aangemaakt door */}
      <div className="card">
        <h3 className="font-heading font-bold text-lg mb-4">Aangemaakt door</h3>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="font-medium text-gray-900">{activiteit.aangemaaktDoor.naam}</p>
            <p className="text-sm text-gray-500">{activiteit.aangemaaktDoor.email}</p>
            <p className="text-sm text-gray-500 capitalize">
              {activiteit.aangemaaktDoor.role}
              {activiteit.aangemaaktDoor.opleiding && ` - ${activiteit.aangemaaktDoor.opleiding.naam}`}
            </p>
          </div>
        </div>
      </div>

      {/* Inschrijvingen */}
      {activiteit.inschrijvingen.length > 0 && (
        <div className="card">
          <h3 className="font-heading font-bold text-lg mb-4">
            Inschrijvingen ({activiteit.inschrijvingen.length})
          </h3>
          <div className="space-y-3">
            {activiteit.inschrijvingen.map((inschrijving) => (
              <div key={inschrijving.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{inschrijving.student.naam}</p>
                  <p className="text-sm text-gray-500">{inschrijving.student.email}</p>
                  {inschrijving.student.opleiding && (
                    <p className="text-sm text-gray-500">{inschrijving.student.opleiding.naam}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="card border-red-200">
        <h3 className="font-heading font-bold text-lg mb-4 text-red-700">
          Gevaarlijke Zone
        </h3>

        {showDeleteConfirm ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <p className="text-sm text-red-800 mb-4">
              Weet je zeker dat je <strong>{activiteit.titel}</strong> wilt verwijderen?
              Deze actie kan niet ongedaan worden gemaakt.
              {activiteit.inschrijvingen.length > 0 && (
                <span className="block mt-2 font-semibold">
                  Er zijn {activiteit.inschrijvingen.length} inschrijving(en) voor deze activiteit!
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Bezig met verwijderen...' : 'Ja, verwijderen'}
              </button>
              <button
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
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Activiteit Verwijderen
          </button>
        )}
      </div>
    </div>
  )
}
