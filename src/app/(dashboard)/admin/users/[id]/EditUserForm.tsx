'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  naam: string
  email: string
  role: string
  actief: boolean
  opleidingId: string | null
  opleiding: {
    id: string
    naam: string
  } | null
}

type Opleiding = {
  id: string
  naam: string
}

export default function EditUserForm({
  user,
  opleidingen,
}: {
  user: User
  opleidingen: Opleiding[]
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState({
    naam: user.naam,
    email: user.email,
    role: user.role,
    opleidingId: user.opleidingId || '',
    actief: user.actief,
    password: '', // Optioneel - alleen invullen als wachtwoord gewijzigd moet worden
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Alleen wachtwoord meesturen als het is ingevuld
      const dataToSend = { ...formData }
      if (!dataToSend.password) {
        delete dataToSend.password
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is iets misgegaan')
      }

      router.push('/admin/users')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is iets misgegaan')
      }

      router.push('/admin/users')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
      setShowDeleteConfirm(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="naam" className="block text-sm font-medium text-gray-700">
          Naam *
        </label>
        <input
          type="text"
          id="naam"
          name="naam"
          required
          value={formData.naam}
          onChange={handleChange}
          className="input-field mt-1"
          placeholder="Volledige naam"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="input-field mt-1"
          placeholder="gebruiker@pxl.be"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Nieuw Wachtwoord
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="input-field mt-1"
          placeholder="Laat leeg om ongewijzigd te laten"
          minLength={8}
        />
        <p className="mt-1 text-sm text-gray-500">
          Laat dit veld leeg als je het wachtwoord niet wilt wijzigen. Minimaal 8
          karakters.
        </p>
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Rol *
        </label>
        <select
          id="role"
          name="role"
          required
          value={formData.role}
          onChange={handleChange}
          className="input-field mt-1"
        >
          <option value="student">Student</option>
          <option value="docent">Docent</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      {formData.role === 'student' && (
        <div>
          <label
            htmlFor="opleidingId"
            className="block text-sm font-medium text-gray-700"
          >
            Opleiding *
          </label>
          <select
            id="opleidingId"
            name="opleidingId"
            required
            value={formData.opleidingId}
            onChange={handleChange}
            className="input-field mt-1"
          >
            <option value="">Selecteer een opleiding</option>
            {opleidingen.map((opleiding) => (
              <option key={opleiding.id} value={opleiding.id}>
                {opleiding.naam}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center">
        <input
          type="checkbox"
          id="actief"
          name="actief"
          checked={formData.actief}
          onChange={handleChange}
          className="h-4 w-4 text-pxl-gold focus:ring-pxl-gold border-gray-300 rounded"
        />
        <label htmlFor="actief" className="ml-2 block text-sm text-gray-700">
          Account is actief
        </label>
      </div>

      <div className="flex gap-4 pt-4 border-t">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1"
        >
          {isLoading ? 'Bezig...' : 'Wijzigingen Opslaan'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary flex-1"
          disabled={isLoading}
        >
          Annuleren
        </button>
      </div>

      {/* Delete Section */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-red-600 mb-2">Gevaarlijke Zone</h3>
        <p className="text-sm text-gray-600 mb-4">
          Het verwijderen van een gebruiker kan niet ongedaan gemaakt worden.
        </p>
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            disabled={isLoading}
          >
            🗑️ Gebruiker Verwijderen
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 p-4 rounded space-y-3">
            <p className="text-sm text-red-800 font-medium">
              Weet je zeker dat je deze gebruiker wilt verwijderen?
            </p>
            <p className="text-sm text-red-700">
              Dit verwijdert ook alle gerelateerde gegevens zoals inschrijvingen en
              activiteiten. Deze actie kan niet ongedaan gemaakt worden.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                {isLoading ? 'Bezig...' : 'Ja, Verwijderen'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
