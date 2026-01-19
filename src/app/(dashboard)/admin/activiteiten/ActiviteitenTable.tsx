'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type Activiteit = {
  id: string
  titel: string
  omschrijving: string | null
  datum: Date
  status: string
  typeActiviteit: string
  maxPlaatsen: number | null
  aangemaaktDoor: {
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
  inschrijvingen: any[]
}

const statusLabels = {
  draft: 'Concept',
  in_review: 'In behandeling',
  approved: 'Goedgekeurd',
  rejected: 'Afgekeurd',
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function ActiviteitenTable({
  activiteiten,
}: {
  activiteiten: Activiteit[]
}) {
  const [statusFilter, setStatusFilter] = useState<string>('in_review')
  const [typeAanvraagFilter, setTypeAanvraagFilter] = useState<string>('student')

  // Filter activiteiten based on selected filters
  const filteredActiviteiten = useMemo(() => {
    let filtered = activiteiten

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter)
    }

    // Filter by type aanvraag (student/docent)
    if (typeAanvraagFilter !== 'all') {
      filtered = filtered.filter((a) => {
        // Check if aangemaaktDoor is student or docent
        const role = a.aangemaaktDoor.role || 'student'
        return role === typeAanvraagFilter
      })
    }

    return filtered
  }, [activiteiten, statusFilter, typeAanvraagFilter])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
            Alle Activiteiten
          </h1>
          <p className="text-pxl-black-light mt-4">
            Overzicht van alle activiteiten in het systeem
          </p>
        </div>
        <Link href="/admin/activiteiten/new" className="btn-primary">
          ➕ Nieuwe Activiteit
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Totaal</div>
          <div className="text-2xl font-bold text-pxl-gold">{activiteiten.length}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">In behandeling</div>
          <div className="text-2xl font-bold text-yellow-600">
            {activiteiten.filter((a) => a.status === 'in_review').length}
          </div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Goedgekeurd</div>
          <div className="text-2xl font-bold text-green-600">
            {activiteiten.filter((a) => a.status === 'approved').length}
          </div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Afgekeurd</div>
          <div className="text-2xl font-bold text-red-600">
            {activiteiten.filter((a) => a.status === 'rejected').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="type-filter" className="text-sm font-medium text-gray-700">
              Aangemaakt door:
            </label>
            <select
              id="type-filter"
              value={typeAanvraagFilter}
              onChange={(e) => setTypeAanvraagFilter(e.target.value)}
              className="input-field w-40"
            >
              <option value="all">Iedereen</option>
              <option value="student">Student</option>
              <option value="docent">Docent</option>
            </select>
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
              <option value="draft">Concept</option>
              <option value="in_review">In behandeling</option>
              <option value="approved">Goedgekeurd</option>
              <option value="rejected">Afgekeurd</option>
            </select>
          </div>

          {(statusFilter !== 'in_review' || typeAanvraagFilter !== 'student') && (
            <button
              onClick={() => {
                setStatusFilter('in_review')
                setTypeAanvraagFilter('student')
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ✕ Reset filters
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
                  Aangemaakt door
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opleiding
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
              {filteredActiviteiten.map((activiteit) => (
                <tr key={activiteit.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(activiteit.datum).toLocaleDateString('nl-BE')}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{activiteit.titel}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {activiteit.omschrijving}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {activiteit.aangemaaktDoor.naam}
                    </div>
                    <div className="text-sm text-gray-500">
                      {activiteit.aangemaaktDoor.email}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activiteit.opleiding?.naam || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {activiteit.status ? (
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusColors[activiteit.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[activiteit.status as keyof typeof statusLabels] || activiteit.status}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Geen status</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/activiteiten/${activiteit.id}/edit`}
                        className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 font-medium transition-colors"
                      >
                        ✏️ Bewerken
                      </Link>
                      <Link
                        href={`/admin/activiteiten/${activiteit.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-pxl-gold text-pxl-gold rounded hover:bg-yellow-50 font-medium transition-colors"
                      >
                        👁️ Beheren
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
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
          <p className="text-pxl-black-light">
            {statusFilter === 'all'
              ? 'Er zijn nog geen activiteiten geregistreerd'
              : `Er zijn geen activiteiten met status "${
                  statusLabels[statusFilter as keyof typeof statusLabels]
                }"`}
          </p>
        </div>
      )}
    </div>
  )
}
