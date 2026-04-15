'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Opleiding = {
  id: string
  naam: string
  code: string
  actief: boolean
  _count: {
    studenten: number
    docenten: number
  }
}

type User = {
  id: string
  naam: string
  email: string
  role: string
  actief: boolean
}

type Docent = {
  id: string
  naam: string
  email: string
  actief: boolean
}

type OpleidingUsers = {
  studenten: User[]
  docenten: Docent[]
}

export default function OpleidingenGrid({
  opleidingen,
  alleDocenten,
}: {
  opleidingen: Opleiding[]
  alleDocenten: { id: string; naam: string; email: string }[]
}) {
  const [selectedOpleiding, setSelectedOpleiding] = useState<Opleiding | null>(null)
  const [users, setUsers] = useState<OpleidingUsers | null>(null)
  const [loading, setLoading] = useState(false)
  const [isKoppeling, setIsKoppeling] = useState(false)
  const [koppelError, setKoppelError] = useState<string | null>(null)
  const [selectedDocentId, setSelectedDocentId] = useState('')

  useEffect(() => {
    if (selectedOpleiding) {
      fetchUsers(selectedOpleiding.id)
    }
  }, [selectedOpleiding])

  const fetchUsers = async (opleidingId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/opleidingen/${opleidingId}/users`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setSelectedOpleiding(null)
    setUsers(null)
    setKoppelError(null)
    setSelectedDocentId('')
  }

  const handleDocentToevoegen = async () => {
    if (!selectedOpleiding || !selectedDocentId) return
    setIsKoppeling(true)
    setKoppelError(null)
    try {
      const res = await fetch(`/api/admin/opleidingen/${selectedOpleiding.id}/docenten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docentId: selectedDocentId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setKoppelError(data.error || 'Er is een fout opgetreden')
      } else {
        setSelectedDocentId('')
        await fetchUsers(selectedOpleiding.id)
      }
    } catch {
      setKoppelError('Er is een fout opgetreden')
    } finally {
      setIsKoppeling(false)
    }
  }

  const handleDocentVerwijderen = async (docentId: string) => {
    if (!selectedOpleiding) return
    setIsKoppeling(true)
    setKoppelError(null)
    try {
      const res = await fetch(
        `/api/admin/opleidingen/${selectedOpleiding.id}/docenten/${docentId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const data = await res.json()
        setKoppelError(data.error || 'Er is een fout opgetreden')
      } else {
        await fetchUsers(selectedOpleiding.id)
      }
    } catch {
      setKoppelError('Er is een fout opgetreden')
    } finally {
      setIsKoppeling(false)
    }
  }

  return (
    <>
      {/* Opleidingen Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {opleidingen.map((opleiding) => (
          <div key={opleiding.id} className={`card ${!opleiding.actief ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-heading font-bold text-xl text-pxl-black">{opleiding.naam}</h3>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  opleiding.actief ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {opleiding.actief ? 'Actief' : 'Inactief'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-pxl-black-light">Studenten:</span>
                <span className="font-semibold text-pxl-black">{opleiding._count.studenten}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-pxl-black-light">Docenten:</span>
                <span className="font-semibold text-pxl-black">{opleiding._count.docenten}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/admin/opleidingen/${opleiding.id}`}
                className="btn-secondary flex-1 text-center"
              >
                Bewerken
              </Link>
              <button
                onClick={() => setSelectedOpleiding(opleiding)}
                className="btn-secondary flex-1"
              >
                Gebruikers
              </button>
            </div>
          </div>
        ))}
      </div>

      {opleidingen.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🏫</div>
          <h3 className="font-heading font-bold text-xl text-pxl-black mb-2">
            Geen opleidingen gevonden
          </h3>
          <p className="text-pxl-black-light mb-4">Voeg je eerste opleiding toe om te beginnen</p>
          <Link href="/admin/opleidingen/new" className="btn-primary inline-block">
            + Nieuwe Opleiding
          </Link>
        </div>
      )}

      {/* Users Modal */}
      {selectedOpleiding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="font-heading font-bold text-xl text-pxl-black">
                  Gebruikers - {selectedOpleiding.naam}
                </h2>
                <p className="text-sm text-gray-500">Code: {selectedOpleiding.code}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin inline-block w-8 h-8 border-2 border-pxl-gold border-t-transparent rounded-full mb-2" />
                  <p className="text-gray-500">Gebruikers laden...</p>
                </div>
              ) : users ? (
                <div className="space-y-6">
                  {/* Studenten */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="text-blue-500">👨‍🎓</span>
                      Studenten ({users.studenten.length})
                    </h3>
                    {users.studenten.length > 0 ? (
                      <div className="space-y-2">
                        {users.studenten.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                          >
                            <div>
                              <div className="font-medium text-gray-900">{student.naam}</div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${
                                  student.actief
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {student.actief ? 'Actief' : 'Inactief'}
                              </span>
                              <Link
                                href={`/admin/users/${student.id}`}
                                className="text-pxl-gold hover:text-pxl-gold-dark text-sm font-medium"
                              >
                                Bekijken
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">
                        Geen studenten in deze opleiding
                      </p>
                    )}
                  </div>

                  {/* Docenten */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="text-green-500">👨‍🏫</span>
                      Docenten ({users.docenten.length})
                    </h3>
                    {users.docenten.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        {users.docenten.map((docent) => (
                          <div
                            key={docent.id}
                            className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                          >
                            <div>
                              <div className="font-medium text-gray-900">{docent.naam}</div>
                              <div className="text-sm text-gray-500">{docent.email}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/users/${docent.id}`}
                                className="text-pxl-gold hover:text-pxl-gold-dark text-sm font-medium"
                              >
                                Bekijken
                              </Link>
                              <button
                                onClick={() => handleDocentVerwijderen(docent.id)}
                                disabled={isKoppeling}
                                className="text-red-500 hover:text-red-700 text-sm font-bold disabled:opacity-40"
                                title="Koppeling verwijderen"
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic mb-3">
                        Geen docenten gekoppeld aan deze opleiding
                      </p>
                    )}

                    {/* Docent toevoegen */}
                    {(() => {
                      const gekoppeldeIds = new Set(users.docenten.map((d) => d.id))
                      const beschikbaar = alleDocenten.filter((d) => !gekoppeldeIds.has(d.id))
                      return beschikbaar.length > 0 ? (
                        <div className="flex gap-2 items-center">
                          <select
                            value={selectedDocentId}
                            onChange={(e) => setSelectedDocentId(e.target.value)}
                            className="input-field flex-1 text-sm"
                            disabled={isKoppeling}
                          >
                            <option value="">— Docent kiezen —</option>
                            {beschikbaar.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.naam}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleDocentToevoegen}
                            disabled={!selectedDocentId || isKoppeling}
                            className="px-3 py-1.5 bg-pxl-gold text-white rounded text-sm font-medium hover:bg-pxl-gold-dark disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Toevoegen
                          </button>
                        </div>
                      ) : null
                    })()}

                    {koppelError && (
                      <p className="text-red-600 text-sm mt-2">{koppelError}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Er ging iets mis bij het laden van de gebruikers
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
              <button onClick={closeModal} className="btn-secondary">
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
