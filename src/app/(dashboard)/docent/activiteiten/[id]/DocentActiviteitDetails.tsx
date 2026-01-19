'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Activiteit = {
  id: string
  titel: string
  omschrijving: string | null
  datum: string
  startuur: string
  einduur: string
  status: string
  typeActiviteit: string
  aard: string | null
  locatie: string | null
  weblink: string | null
  organisatorPxl: string | null
  organisatorExtern: string | null
  maxPlaatsen: number | null
  opleiding: {
    naam: string
  } | null
  inschrijvingen: {
    id: string
    effectieveDeelname: boolean
    inschrijvingsstatus: string
    student: {
      id: string
      naam: string
      email: string
      opleiding: {
        naam: string
      } | null
    }
  }[]
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

export default function DocentActiviteitDetails({
  activiteit,
}: {
  activiteit: Activiteit
}) {
  const router = useRouter()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const isPast = new Date(activiteit.datum) < new Date()
  const ingeschrevenStudenten = activiteit.inschrijvingen.filter(
    (i) => i.inschrijvingsstatus === 'ingeschreven'
  )

  const handleToggleDeelname = async (inschrijvingId: string, currentValue: boolean) => {
    setUpdatingId(inschrijvingId)
    try {
      const response = await fetch(`/api/docent/inschrijvingen/${inschrijvingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ effectieveDeelname: !currentValue }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating deelname:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-2">Datum & Tijd</h3>
          <p className="text-2xl font-bold text-pxl-gold">
            {new Date(activiteit.datum).toLocaleDateString('nl-BE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-gray-600">
            {activiteit.startuur} - {activiteit.einduur}
          </p>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-2">Status</h3>
          <span
            className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
              statusColors[activiteit.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {statusLabels[activiteit.status] || activiteit.status}
          </span>
          {isPast && (
            <p className="text-sm text-gray-500 mt-2">
              Deze activiteit is afgelopen
            </p>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-2">Inschrijvingen</h3>
          <p className="text-2xl font-bold text-pxl-gold">
            {ingeschrevenStudenten.length}
            {activiteit.maxPlaatsen && ` / ${activiteit.maxPlaatsen}`}
          </p>
          <p className="text-gray-600">
            {activiteit.maxPlaatsen
              ? `${activiteit.maxPlaatsen - ingeschrevenStudenten.length} plaatsen beschikbaar`
              : 'Onbeperkt aantal plaatsen'}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="card">
        <h2 className="font-heading font-bold text-xl mb-4">Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-1">Type</h3>
            <p className="capitalize">{activiteit.typeActiviteit}</p>
          </div>

          {activiteit.aard && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Aard</h3>
              <p>{activiteit.aard}</p>
            </div>
          )}

          {activiteit.locatie && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Locatie</h3>
              <p>{activiteit.locatie}</p>
            </div>
          )}

          {activiteit.opleiding && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Opleiding</h3>
              <p>{activiteit.opleiding.naam}</p>
            </div>
          )}

          {activiteit.organisatorPxl && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Organisator PXL</h3>
              <p>{activiteit.organisatorPxl}</p>
            </div>
          )}

          {activiteit.organisatorExtern && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Externe Organisator</h3>
              <p>{activiteit.organisatorExtern}</p>
            </div>
          )}

          {activiteit.weblink && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Website</h3>
              <a
                href={activiteit.weblink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pxl-gold hover:underline"
              >
                {activiteit.weblink}
              </a>
            </div>
          )}
        </div>

        {activiteit.omschrijving && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-1">Omschrijving</h3>
            <p className="whitespace-pre-wrap">{activiteit.omschrijving}</p>
          </div>
        )}
      </div>

      {/* Inschrijvingen */}
      <div className="card">
        <h2 className="font-heading font-bold text-xl mb-4">
          Ingeschreven Studenten ({ingeschrevenStudenten.length})
        </h2>

        {ingeschrevenStudenten.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">
            Er zijn nog geen studenten ingeschreven voor deze activiteit.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opleiding
                  </th>
                  {isPast && (
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deelname
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ingeschrevenStudenten.map((inschrijving) => (
                  <tr key={inschrijving.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {inschrijving.student.naam}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inschrijving.student.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inschrijving.student.opleiding?.naam || '-'}
                    </td>
                    {isPast && (
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() =>
                            handleToggleDeelname(
                              inschrijving.id,
                              inschrijving.effectieveDeelname
                            )
                          }
                          disabled={updatingId === inschrijving.id}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            inschrijving.effectieveDeelname
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {updatingId === inschrijving.id
                            ? '...'
                            : inschrijving.effectieveDeelname
                            ? 'Aanwezig'
                            : 'Niet bevestigd'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
