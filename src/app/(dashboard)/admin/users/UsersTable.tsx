'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type User = {
  id: string
  naam: string
  email: string
  role: string
  actief: boolean
  opleiding: { id: string; naam: string } | null
  docentOpleidingen: { opleiding: { id: string; naam: string } }[]
}

type Opleiding = {
  id: string
  naam: string
}

const ROLE_LABELS = { admin: 'Administrator', docent: 'Docent', student: 'Student' }
const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-800',
  docent: 'bg-blue-100 text-blue-800',
  student: 'bg-green-100 text-green-800',
}

const PAGE_SIZE = 10

export default function UsersTable({
  users,
  opleidingen,
}: {
  users: User[]
  opleidingen: Opleiding[]
}) {
  const [search, setSearch] = useState('')
  const [opleidingFilter, setOpleidingFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let result = users
    if (opleidingFilter !== 'all') {
      result = opleidingFilter === 'none'
        ? result.filter((u) => !u.opleiding)
        : result.filter((u) => u.opleiding?.id === opleidingFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) => u.naam.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      )
    }
    return result
  }, [users, opleidingFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function resetFilters() {
    setSearch('')
    setOpleidingFilter('all')
    setPage(1)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
            Gebruikersbeheer
          </h1>
          <p className="text-pxl-black-light mt-4">Beheer alle gebruikers in het systeem</p>
        </div>
        <Link href="/admin/users/new" className="btn-primary">
          ➕ Nieuwe Gebruiker
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Totaal Gebruikers</div>
          <div className="text-2xl font-bold text-pxl-gold">{users.length}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Admins</div>
          <div className="text-2xl font-bold text-red-600">
            {users.filter((u) => u.role === 'admin').length}
          </div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Docenten</div>
          <div className="text-2xl font-bold text-blue-600">
            {users.filter((u) => u.role === 'docent').length}
          </div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Studenten</div>
          <div className="text-2xl font-bold text-green-600">
            {users.filter((u) => u.role === 'student').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Zoek op naam of email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="input-field w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Opleiding:</label>
            <select
              value={opleidingFilter}
              onChange={(e) => { setOpleidingFilter(e.target.value); setPage(1) }}
              className="input-field w-48"
            >
              <option value="all">Alle opleidingen</option>
              <option value="none">Zonder opleiding</option>
              {opleidingen.map((o) => (
                <option key={o.id} value={o.id}>{o.naam}</option>
              ))}
            </select>
          </div>
          {(search || opleidingFilter !== 'all') && (
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ✕ Reset filters
            </button>
          )}
        </div>
        <div className="mt-3 text-sm text-gray-500">
          {filtered.length} van {users.length} gebruikers
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gebruiker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opleiding</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paged.map((user) => (
                <tr key={user.id} className={!user.actief ? 'opacity-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.naam}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ROLE_COLORS[user.role as keyof typeof ROLE_COLORS] ?? 'bg-gray-100 text-gray-800'}`}>
                      {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.role === 'docent'
                      ? user.docentOpleidingen.length > 0
                        ? user.docentOpleidingen.map((d) => d.opleiding.naam).join(', ')
                        : '-'
                      : user.opleiding?.naam || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.actief ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.actief ? 'Actief' : 'Inactief'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/admin/users/${user.id}`} className="text-pxl-gold hover:text-pxl-gold-dark">
                      Bewerken
                    </Link>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Geen gebruikers gevonden
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
