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

type OpleidingUsers = {
  studenten: User[]
  docenten: User[]
}

export default function OpleidingenGrid({ opleidingen }: { opleidingen: Opleiding[] }) {
  const [selectedOpleiding, setSelectedOpleiding] = useState<Opleiding | null>(null)
  const [users, setUsers] = useState<OpleidingUsers | null>(null)
  const [loading, setLoading] = useState(false)

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
                      <div className="space-y-2">
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
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${
                                  docent.actief
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {docent.actief ? 'Actief' : 'Inactief'}
                              </span>
                              <Link
                                href={`/admin/users/${docent.id}`}
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
                        Geen docenten gekoppeld aan deze opleiding
                      </p>
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
