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
    opleiding: { naam: string } | null
  }
  opleiding: { id: string; naam: string } | null
  inschrijvingen: any[]
}

type Opleiding = {
  id: string
  naam: string
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

const PAGE_SIZE = 10

export default function ActiviteitenTable({
  activiteiten,
  opleidingen,
}: {
  activiteiten: Activiteit[]
  opleidingen: Opleiding[]
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('in_review')
  const [typeAanvraagFilter, setTypeAanvraagFilter] = useState<string>('student')
  const [opleidingFilter, setOpleidingFilter] = useState<string>('all')
  const [beginDatum, setBeginDatum] = useState('')
  const [eindDatum, setEindDatum] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let result = activiteiten

    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter)
    }

    if (typeAanvraagFilter !== 'all') {
      result = result.filter((a) => (a.aangemaaktDoor.role || 'student') === typeAanvraagFilter)
    }

    if (opleidingFilter !== 'all') {
      result = result.filter((a) => a.opleiding?.id === opleidingFilter)
    }

    if (beginDatum) {
      const begin = new Date(beginDatum)
      result = result.filter((a) => new Date(a.datum) >= begin)
    }

    if (eindDatum) {
      const eind = new Date(eindDatum)
      eind.setHours(23, 59, 59, 999)
      result = result.filter((a) => new Date(a.datum) <= eind)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.titel.toLowerCase().includes(q) ||
          (a.omschrijving?.toLowerCase().includes(q) ?? false) ||
          a.aangemaaktDoor.naam.toLowerCase().includes(q)
      )
    }

    return result
  }, [activiteiten, statusFilter, typeAanvraagFilter, opleidingFilter, beginDatum, eindDatum, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const hasFilters =
    statusFilter !== 'in_review' ||
    typeAanvraagFilter !== 'student' ||
    opleidingFilter !== 'all' ||
    beginDatum ||
    eindDatum ||
    search

  function resetFilters() {
    setSearch('')
    setStatusFilter('in_review')
    setTypeAanvraagFilter('student')
    setOpleidingFilter('all')
    setBeginDatum('')
    setEindDatum('')
    setPage(1)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
            Alle Activiteiten
          </h1>
          <p className="text-pxl-black-light mt-4">Overzicht van alle activiteiten in het systeem</p>
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
      <div className="card space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
          {/* Zoekbalk */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Zoek op titel of naam..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="input-field w-full"
            />
          </div>

          {/* Type */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Door:</label>
            <select
              value={typeAanvraagFilter}
              onChange={(e) => { setTypeAanvraagFilter(e.target.value); setPage(1) }}
              className="input-field w-36"
            >
              <option value="all">Iedereen</option>
              <option value="student">Student</option>
              <option value="docent">Docent</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="input-field w-44"
            >
              <option value="all">Alle statussen</option>
              <option value="draft">Concept</option>
              <option value="in_review">In behandeling</option>
              <option value="approved">Goedgekeurd</option>
              <option value="rejected">Afgekeurd</option>
            </select>
          </div>

          {/* Opleiding */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Opleiding:</label>
            <select
              value={opleidingFilter}
              onChange={(e) => { setOpleidingFilter(e.target.value); setPage(1) }}
              className="input-field w-48"
            >
              <option value="all">Alle opleidingen</option>
              {opleidingen.map((o) => (
                <option key={o.id} value={o.id}>{o.naam}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Datumfilter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Van:</label>
            <input
              type="date"
              value={beginDatum}
              onChange={(e) => { setBeginDatum(e.target.value); setPage(1) }}
              className="input-field w-44"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Tot:</label>
            <input
              type="date"
              value={eindDatum}
              onChange={(e) => { setEindDatum(e.target.value); setPage(1) }}
              className="input-field w-44"
            />
          </div>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ✕ Reset filters
            </button>
          )}
        </div>

        <div className="text-sm text-gray-500">
          {filtered.length} van {activiteiten.length} activiteiten
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activiteit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aangemaakt door</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opleiding</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paged.map((activiteit) => (
                <tr key={activiteit.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(activiteit.datum).toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{activiteit.titel}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{activiteit.omschrijving}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{activiteit.aangemaaktDoor.naam}</div>
                    <div className="text-sm text-gray-500">{activiteit.aangemaaktDoor.email}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activiteit.opleiding?.naam || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {activiteit.status ? (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[activiteit.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
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
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Geen activiteiten gevonden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginatie */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Pagina {currentPage} van {totalPages} ({filtered.length} resultaten)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Vorige
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`px-3 py-1.5 border rounded text-sm font-medium transition-colors ${
                      currentPage === p
                        ? 'bg-pxl-gold border-pxl-gold text-white'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Volgende →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
