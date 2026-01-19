'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BewijsstukkenUpload from '@/components/bewijsstukken/BewijsstukkenUpload'

type Bewijsstuk = {
  id: string
  bestandsnaam: string
  bestandspad: string
  type: string
  uploadedAt: string
}

type Activiteit = {
  id: string
  titel: string
  typeActiviteit: string
  datum: string
  startuur: string
  einduur: string
  locatie: string | null
  typeAanvraag: string
}

type Inschrijving = {
  id: string
  inschrijvingsstatus: string
  effectieveDeelname: boolean
  bewijsStatus: string
  bewijsIngediendOp: string | null
  bewijsBeoordeeldOp: string | null
  bewijsFeedback: string | null
  activiteit: Activiteit
  bewijsstukken: Bewijsstuk[]
}

type BewijsstukkenTableProps = {
  inschrijvingen: Inschrijving[]
}

const bewijsStatusConfig: Record<string, { label: string; color: string }> = {
  niet_ingediend: { label: 'Niet ingediend', color: 'bg-gray-100 text-gray-700' },
  ingediend: { label: 'Wacht op goedkeuring', color: 'bg-yellow-100 text-yellow-700' },
  goedgekeurd: { label: 'Goedgekeurd', color: 'bg-green-100 text-green-700' },
  afgekeurd: { label: 'Afgekeurd', color: 'bg-red-100 text-red-700' },
}

export default function BewijsstukkenTable({ inschrijvingen }: BewijsstukkenTableProps) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmitBewijs = async (inschrijvingId: string) => {
    if (!confirm('Weet je zeker dat je de bewijsstukken wilt indienen ter goedkeuring?')) return

    setSubmitting(inschrijvingId)
    setError(null)

    try {
      const response = await fetch('/api/student/bewijsstukken/indienen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inschrijvingId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Indienen mislukt')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setSubmitting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-BE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const canUpload = (inschrijving: Inschrijving) => {
    return inschrijving.bewijsStatus === 'niet_ingediend' || inschrijving.bewijsStatus === 'afgekeurd'
  }

  const canSubmit = (inschrijving: Inschrijving) => {
    return (
      (inschrijving.bewijsStatus === 'niet_ingediend' || inschrijving.bewijsStatus === 'afgekeurd') &&
      inschrijving.bewijsstukken.length > 0
    )
  }

  if (inschrijvingen.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-4xl mb-4">📁</div>
        <h3 className="font-heading font-bold text-xl text-pxl-black mb-2">
          Geen activiteiten gevonden
        </h3>
        <p className="text-pxl-black-light">
          Je hebt nog geen goedgekeurde inschrijvingen of activiteiten waarvoor je bewijsstukken kan
          uploaden.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activiteit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bewijsstukken
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inschrijvingen.map((inschrijving) => (
                <>
                  <tr key={inschrijving.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(inschrijving.activiteit.datum)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {inschrijving.activiteit.startuur} - {inschrijving.activiteit.einduur}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {inschrijving.activiteit.titel}
                      </div>
                      <div className="text-sm text-gray-500">
                        {inschrijving.activiteit.typeActiviteit}
                        {inschrijving.activiteit.locatie && ` • ${inschrijving.activiteit.locatie}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {inschrijving.bewijsstukken.length} bestand
                        {inschrijving.bewijsstukken.length !== 1 ? 'en' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bewijsStatusConfig[inschrijving.bewijsStatus]?.color || 'bg-gray-100 text-gray-700'}`}
                      >
                        {bewijsStatusConfig[inschrijving.bewijsStatus]?.label ||
                          inschrijving.bewijsStatus}
                      </span>
                      {inschrijving.bewijsStatus === 'goedgekeurd' &&
                        inschrijving.bewijsBeoordeeldOp && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(inschrijving.bewijsBeoordeeldOp)}
                          </div>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === inschrijving.id ? null : inschrijving.id)
                          }
                          className="btn-secondary text-sm"
                        >
                          {expandedId === inschrijving.id ? 'Sluiten' : 'Beheren'}
                        </button>
                        {canSubmit(inschrijving) && (
                          <button
                            onClick={() => handleSubmitBewijs(inschrijving.id)}
                            disabled={submitting === inschrijving.id}
                            className="btn-primary text-sm"
                          >
                            {submitting === inschrijving.id ? 'Bezig...' : 'Indienen'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === inschrijving.id && (
                    <tr key={`${inschrijving.id}-expanded`}>
                      <td colSpan={5} className="px-6 py-4 bg-gray-50">
                        <div className="max-w-2xl">
                          {/* Feedback bij afkeuring */}
                          {inschrijving.bewijsStatus === 'afgekeurd' &&
                            inschrijving.bewijsFeedback && (
                              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <span className="text-red-500">⚠️</span>
                                  <div>
                                    <p className="font-medium text-red-700">
                                      Feedback van docent:
                                    </p>
                                    <p className="text-red-600 text-sm mt-1">
                                      {inschrijving.bewijsFeedback}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                          {/* Status info */}
                          {inschrijving.bewijsStatus === 'ingediend' && (
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-yellow-700 text-sm">
                                Je bewijsstukken zijn ingediend en wachten op goedkeuring door een
                                docent. Je kunt geen wijzigingen meer aanbrengen totdat de docent
                                een beslissing heeft genomen.
                              </p>
                            </div>
                          )}

                          {inschrijving.bewijsStatus === 'goedgekeurd' && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-green-700 text-sm">
                                Je bewijsstukken zijn goedgekeurd! De uren voor deze activiteit
                                tellen nu mee in je scorekaart.
                              </p>
                            </div>
                          )}

                          {/* Upload component */}
                          <BewijsstukkenUpload
                            inschrijvingId={inschrijving.id}
                            bewijsstukken={inschrijving.bewijsstukken.map((b) => ({
                              id: b.id,
                              type: b.type,
                              bestandsnaam: b.bestandsnaam,
                              bestandspad: b.bestandspad,
                              uploadedAt: b.uploadedAt,
                            }))}
                            canUpload={canUpload(inschrijving)}
                            canDelete={canUpload(inschrijving)}
                          />

                          {/* Submit button in expanded view */}
                          {canSubmit(inschrijving) && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <button
                                onClick={() => handleSubmitBewijs(inschrijving.id)}
                                disabled={submitting === inschrijving.id}
                                className="btn-primary"
                              >
                                {submitting === inschrijving.id
                                  ? 'Bezig met indienen...'
                                  : 'Bewijsstukken Indienen ter Goedkeuring'}
                              </button>
                              <p className="text-xs text-gray-500 mt-2">
                                Na het indienen kan je geen wijzigingen meer aanbrengen totdat de
                                docent een beslissing heeft genomen.
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
