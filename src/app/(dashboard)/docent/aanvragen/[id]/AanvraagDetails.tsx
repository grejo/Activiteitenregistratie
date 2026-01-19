'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Aanvraag = {
  id: string
  titel: string
  omschrijving: string | null
  datum: string
  createdAt: string
  startuur: string
  einduur: string
  typeActiviteit: string
  aard: string | null
  locatie: string | null
  weblink: string | null
  organisatorPxl: string | null
  organisatorExtern: string | null
  bewijslink: string | null
  status: string
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
  duurzaamheid: {
    duurzaamheid: {
      naam: string
    }
  }[]
}

const statusLabels: Record<string, string> = {
  in_review: 'In behandeling',
  goedgekeurd: 'Goedgekeurd',
  afgekeurd: 'Afgekeurd',
}

const statusColors: Record<string, string> = {
  in_review: 'bg-yellow-100 text-yellow-800',
  goedgekeurd: 'bg-green-100 text-green-800',
  afgekeurd: 'bg-red-100 text-red-800',
}

export default function AanvraagDetails({ aanvraag }: { aanvraag: Aanvraag }) {
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [opmerkingen, setOpmerkingen] = useState('')

  const handleAction = async (action: 'goedkeuren' | 'afkeuren') => {
    setProcessing(true)
    setError(null)

    try {
      const newStatus = action === 'goedkeuren' ? 'goedgekeurd' : 'afgekeurd'

      const response = await fetch(`/api/docent/aanvragen/${aanvraag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, opmerkingen }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Er is een fout opgetreden')
      }

      router.push('/docent/aanvragen')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      setProcessing(false)
    }
  }

  const isProcessed = aanvraag.status !== 'in_review'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              statusColors[aanvraag.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {statusLabels[aanvraag.status] || aanvraag.status}
          </span>
          <span className="text-sm text-gray-500">
            Aangevraagd op {new Date(aanvraag.createdAt).toLocaleDateString('nl-BE')}
          </span>
        </div>

        {/* Activity Details */}
        <div className="card">
          <h2 className="font-heading font-bold text-xl text-pxl-black mb-4">
            {aanvraag.titel}
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-sm text-gray-500">Datum</div>
              <div className="font-medium">
                {new Date(aanvraag.datum).toLocaleDateString('nl-BE')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Tijd</div>
              <div className="font-medium">
                {aanvraag.startuur} - {aanvraag.einduur}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Type</div>
              <div className="font-medium capitalize">{aanvraag.typeActiviteit}</div>
            </div>
            {aanvraag.aard && (
              <div>
                <div className="text-sm text-gray-500">Aard</div>
                <div className="font-medium capitalize">{aanvraag.aard}</div>
              </div>
            )}
            {aanvraag.locatie && (
              <div>
                <div className="text-sm text-gray-500">Locatie</div>
                <div className="font-medium">{aanvraag.locatie}</div>
              </div>
            )}
            {aanvraag.opleiding && (
              <div>
                <div className="text-sm text-gray-500">Opleiding</div>
                <div className="font-medium">{aanvraag.opleiding.naam}</div>
              </div>
            )}
          </div>

          {aanvraag.omschrijving && (
            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-1">Omschrijving</div>
              <p className="text-gray-700 whitespace-pre-wrap">{aanvraag.omschrijving}</p>
            </div>
          )}

          {/* Links */}
          {(aanvraag.weblink || aanvraag.bewijslink) && (
            <div className="border-t pt-4 mt-4">
              <div className="text-sm text-gray-500 mb-2">Links</div>
              <div className="flex flex-wrap gap-2">
                {aanvraag.weblink && (
                  <a
                    href={aanvraag.weblink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    Website/Info
                  </a>
                )}
                {aanvraag.bewijslink && (
                  <a
                    href={aanvraag.bewijslink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    Bewijs/Documentatie
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Organisator */}
          {(aanvraag.organisatorPxl || aanvraag.organisatorExtern) && (
            <div className="border-t pt-4 mt-4">
              <div className="text-sm text-gray-500 mb-2">Organisator</div>
              {aanvraag.organisatorPxl && (
                <div className="text-sm">
                  <span className="font-medium">PXL:</span> {aanvraag.organisatorPxl}
                </div>
              )}
              {aanvraag.organisatorExtern && (
                <div className="text-sm">
                  <span className="font-medium">Extern:</span> {aanvraag.organisatorExtern}
                </div>
              )}
            </div>
          )}

          {/* Duurzaamheid */}
          {aanvraag.duurzaamheid.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <div className="text-sm text-gray-500 mb-2">Duurzaamheidsthema&apos;s</div>
              <div className="flex flex-wrap gap-2">
                {aanvraag.duurzaamheid.map((d, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm"
                  >
                    {d.duurzaamheid.naam}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Student Info */}
        <div className="card">
          <h3 className="font-heading font-bold text-lg text-pxl-black mb-4">
            Aangevraagd door
          </h3>
          <div className="space-y-2">
            <div className="font-medium text-gray-900">{aanvraag.aangemaaktDoor.naam}</div>
            <div className="text-sm text-gray-500">{aanvraag.aangemaaktDoor.email}</div>
            {aanvraag.aangemaaktDoor.opleiding && (
              <div className="text-sm text-gray-500">
                {aanvraag.aangemaaktDoor.opleiding.naam}
              </div>
            )}
          </div>
        </div>

        {/* Action Panel */}
        {!isProcessed && (
          <div className="card">
            <h3 className="font-heading font-bold text-lg text-pxl-black mb-4">
              Beoordeling
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
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

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleAction('goedkeuren')}
                disabled={processing}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
              >
                {processing ? 'Bezig...' : 'Goedkeuren'}
              </button>
              <button
                onClick={() => handleAction('afkeuren')}
                disabled={processing}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
              >
                {processing ? 'Bezig...' : 'Afkeuren'}
              </button>
            </div>
          </div>
        )}

        {isProcessed && (
          <div className="card">
            <h3 className="font-heading font-bold text-lg text-pxl-black mb-4">
              Status
            </h3>
            <p className="text-gray-600">
              Deze aanvraag is al {aanvraag.status === 'goedgekeurd' ? 'goedgekeurd' : 'afgekeurd'}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
