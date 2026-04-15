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
  createdAt: string
  gearchiveerdOp: string | null
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
  isCoordinator: boolean
}

export default function StudentenTable({
  studenten,
  opleidingen,
}: {
  studenten: Student[]
  opleidingen: Opleiding[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [opleidingFilter, setOpleidingFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('actief')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  const filteredStudenten = useMemo(() => {
    let filtered = studenten

    if (statusFilter === 'actief') {
      filtered = filtered.filter((s) => !s.gearchiveerdOp)
    } else if (statusFilter === 'gearchiveerd') {
      filtered = filtered.filter((s) => !!s.gearchiveerdOp)
    }

    if (opleidingFilter !== 'all') {
      filtered = filtered.filter((s) => s.opleiding?.id === opleidingFilter)
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

  const totalPages = Math.ceil(filteredStudenten.length / PAGE_SIZE)
  const paginatedStudenten = filteredStudenten.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const stats = useMemo(() => {
    const totalStudenten = studenten.filter((s) => !s.gearchiveerdOp).length
    const gearchiveerdStudenten = studenten.filter((s) => !!s.gearchiveerdOp).length
    const totalDeelnames = studenten.filter((s) => !s.gearchiveerdOp).reduce((sum, s) => sum + s._count.inschrijvingen, 0)
    return { totalStudenten, gearchiveerdStudenten, totalDeelnames }
  }, [studenten])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Studenten
        </h1>
        <p className="text-pxl-black-light mt-4">
          Overzicht van studenten in jouw opleiding(en)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Actieve Studenten</div>
          <div className="text-2xl font-bold text-pxl-gold">{stats.totalStudenten}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Totaal Deelnames</div>
          <div className="text-2xl font-bold text-green-600">{stats.totalDeelnames}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Opleidingen</div>
          <div className="text-2xl font-bold text-blue-600">{opleidingen.length}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Gearchiveerd</div>
          <div className="text-2xl font-bold text-purple-600">{stats.gearchiveerdStudenten}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Zoek op naam of email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className="input-field w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
              className="input-field w-40"
            >
              <option value="actief">Actief</option>
              <option value="gearchiveerd">Gearchiveerd</option>
              <option value="all">Alle</option>
            </select>
          </div>

          {opleidingen.length > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="opleiding-filter" className="text-sm font-medium text-gray-700">
                Opleiding:
              </label>
              <select
                id="opleiding-filter"
                value={opleidingFilter}
                onChange={(e) => { setOpleidingFilter(e.target.value); setCurrentPage(1) }}
                className="input-field w-48"
              >
                <option value="all">Alle opleidingen</option>
                {opleidingen.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.naam}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(opleidingFilter !== 'all' || searchQuery || statusFilter !== 'actief') && (
            <button
              onClick={() => {
                setOpleidingFilter('all')
                setStatusFilter('actief')
                setSearchQuery('')
                setCurrentPage(1)
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Reset filters
            </button>
          )}
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
                {paginatedStudenten.map((student) => {
                  const laatsteInschrijving = student.inschrijvingen[0]
                  return (
                    <tr key={student.id} className={student.gearchiveerdOp ? 'bg-gray-50 opacity-75' : ''}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{student.naam}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                        {student.gearchiveerdOp && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                            Gearchiveerd
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.opleiding?.naam || '-'}
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
                              {new Date(laatsteInschrijving.activiteit.datum).toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
                            href={`/docent/studenten/${student.id}/scorekaart`}
                            className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 font-medium transition-colors"
                          >
                            Scorekaart
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-500">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredStudenten.length)} van {filteredStudenten.length} studenten
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Vorige
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-sm border rounded ${
                      page === currentPage
                        ? 'bg-pxl-gold text-white border-pxl-gold'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Volgende
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="font-heading font-bold text-xl text-pxl-black mb-2">
            Geen studenten gevonden
          </h3>
          <p className="text-pxl-black-light">
            {studenten.length === 0
              ? 'Er zijn nog geen studenten in jouw opleiding(en)'
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
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-medium text-lg text-gray-900">{selectedStudent.naam}</div>
                  {selectedStudent.gearchiveerdOp && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Gearchiveerd op {new Date(selectedStudent.gearchiveerdOp).toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">{selectedStudent.email}</div>
                {selectedStudent.opleiding && (
                  <div className="text-sm text-gray-500 mt-1">{selectedStudent.opleiding.naam}</div>
                )}
                <div className="mt-3 flex gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Deelnames</div>
                    <div className="font-bold text-green-600">{selectedStudent._count.inschrijvingen}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Inschrijvingen</div>
                    <div className="font-bold text-blue-600">{selectedStudent.inschrijvingen.length}</div>
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
                            {new Date(inschrijving.activiteit.datum).toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
              <Link
                href={`/docent/studenten/${selectedStudent.id}/scorekaart`}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors"
              >
                Bekijk Scorekaart
              </Link>
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
