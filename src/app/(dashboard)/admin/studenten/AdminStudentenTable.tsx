'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type Inschrijving = {
  id: string
  effectieveDeelname: boolean
  inschrijvingsstatus: string
  createdAt: string
  activiteit: {
    id: string
    titel: string
    datum: string
    status: string
  }
}

type Student = {
  id: string
  naam: string
  email: string
  actief: boolean
  createdAt: string
  opleiding: {
    id: string
    naam: string
  } | null
  inschrijvingen: Inschrijving[]
  _count: {
    inschrijvingen: number
  }
}

type Opleiding = {
  id: string
  naam: string
}

export default function AdminStudentenTable({
  studenten,
  opleidingen,
}: {
  studenten: Student[]
  opleidingen: Opleiding[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [opleidingFilter, setOpleidingFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const filteredStudenten = useMemo(() => {
    let filtered = studenten

    if (opleidingFilter !== 'all') {
      if (opleidingFilter === 'none') {
        filtered = filtered.filter((s) => !s.opleiding)
      } else {
        filtered = filtered.filter((s) => s.opleiding?.id === opleidingFilter)
      }
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) =>
        statusFilter === 'actief' ? s.actief : !s.actief
      )
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.naam.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [studenten, opleidingFilter, statusFilter, searchQuery])

  const stats = useMemo(() => {
    const totalStudenten = studenten.length
    const actiefStudenten = studenten.filter((s) => s.actief).length
    const totalDeelnames = studenten.reduce((sum, s) => sum + s._count.inschrijvingen, 0)
    const zonderOpleiding = studenten.filter((s) => !s.opleiding).length

    return { totalStudenten, actiefStudenten, totalDeelnames, zonderOpleiding }
  }, [studenten])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Alle Studenten
        </h1>
        <p className="text-pxl-black-light mt-4">
          Overzicht van alle studenten in het systeem
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Totaal Studenten</div>
          <div className="text-2xl font-bold text-pxl-gold">{stats.totalStudenten}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Actieve Studenten</div>
          <div className="text-2xl font-bold text-green-600">{stats.actiefStudenten}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Totaal Deelnames</div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalDeelnames}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Zonder Opleiding</div>
          <div className="text-2xl font-bold text-orange-600">{stats.zonderOpleiding}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Zoek op naam of email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="opleiding-filter" className="text-sm font-medium text-gray-700">
              Opleiding:
            </label>
            <select
              id="opleiding-filter"
              value={opleidingFilter}
              onChange={(e) => setOpleidingFilter(e.target.value)}
              className="input-field w-48"
            >
              <option value="all">Alle opleidingen</option>
              <option value="none">Zonder opleiding</option>
              {opleidingen.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.naam}
                </option>
              ))}
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
              className="input-field w-36"
            >
              <option value="all">Alle</option>
              <option value="actief">Actief</option>
              <option value="inactief">Inactief</option>
            </select>
          </div>

          {(opleidingFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setOpleidingFilter('all')
                setStatusFilter('all')
                setSearchQuery('')
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Reset filters
            </button>
          )}
        </div>

        <div className="mt-3 text-sm text-gray-500">
          {filteredStudenten.length} van {studenten.length} studenten
        </div>
      </div>

      {/* Table */}
      {filteredStudenten.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opleiding
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deelnames
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Laatste Activiteit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudenten.map((student) => {
                  const laatsteInschrijving = student.inschrijvingen[0]
                  return (
                    <tr key={student.id} className={!student.actief ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{student.naam}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.opleiding?.naam || (
                          <span className="text-orange-600">Geen opleiding</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {student.actief ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            Actief
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                            Inactief
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-green-600">
                          {student._count.inschrijvingen} deelnames
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {laatsteInschrijving ? (
                          <div>
                            <div className="text-sm text-gray-900 truncate max-w-xs">
                              {laatsteInschrijving.activiteit.titel}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(laatsteInschrijving.activiteit.datum).toLocaleDateString('nl-BE')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Geen activiteiten</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="inline-flex items-center px-3 py-1.5 border border-pxl-gold text-pxl-gold rounded hover:bg-yellow-50 font-medium transition-colors"
                          >
                            Details
                          </button>
                          <Link
                            href={`/admin/users/${student.id}/scorekaart`}
                            className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 font-medium transition-colors"
                          >
                            Scorekaart
                          </Link>
                          <Link
                            href={`/admin/users/${student.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium transition-colors"
                          >
                            Bewerken
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
      ) : (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="font-heading font-bold text-xl text-pxl-black mb-2">
            Geen studenten gevonden
          </h3>
          <p className="text-pxl-black-light">
            {studenten.length === 0
              ? 'Er zijn nog geen studenten in het systeem'
              : 'Geen studenten gevonden met de huidige filters'}
          </p>
        </div>
      )}

      {/* Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="font-heading font-bold text-xl text-pxl-black">
                Student Details
              </h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-lg text-gray-900">{selectedStudent.naam}</div>
                    <div className="text-sm text-gray-500">{selectedStudent.email}</div>
                    {selectedStudent.opleiding ? (
                      <div className="text-sm text-gray-500 mt-1">{selectedStudent.opleiding.naam}</div>
                    ) : (
                      <div className="text-sm text-orange-600 mt-1">Geen opleiding toegewezen</div>
                    )}
                  </div>
                  {selectedStudent.actief ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      Actief
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                      Inactief
                    </span>
                  )}
                </div>
                <div className="mt-3 flex gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Deelnames</div>
                    <div className="font-bold text-green-600">{selectedStudent._count.inschrijvingen}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Inschrijvingen</div>
                    <div className="font-bold text-blue-600">{selectedStudent.inschrijvingen.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Aangemaakt</div>
                    <div className="font-medium text-gray-600">
                      {new Date(selectedStudent.createdAt).toLocaleDateString('nl-BE')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div>
                <h3 className="font-heading font-bold text-lg text-pxl-black mb-3">
                  Recente Activiteiten
                </h3>
                {selectedStudent.inschrijvingen.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStudent.inschrijvingen.map((inschrijving) => (
                      <div
                        key={inschrijving.id}
                        className="border rounded-lg p-3 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {inschrijving.activiteit.titel}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(inschrijving.activiteit.datum).toLocaleDateString('nl-BE')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {inschrijving.effectieveDeelname ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                              Deelgenomen
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                              Ingeschreven
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Deze student heeft nog geen activiteiten.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-between">
              <div className="flex gap-2">
                <Link
                  href={`/admin/users/${selectedStudent.id}/scorekaart`}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors"
                >
                  Bekijk Scorekaart
                </Link>
                <Link
                  href={`/admin/users/${selectedStudent.id}`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 font-medium transition-colors"
                >
                  Bewerken
                </Link>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 font-medium transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
