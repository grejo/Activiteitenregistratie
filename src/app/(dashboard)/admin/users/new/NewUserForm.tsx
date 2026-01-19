'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Opleiding = {
  id: string
  naam: string
}

export default function NewUserForm({ opleidingen }: { opleidingen: Opleiding[] }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    naam: '',
    email: '',
    password: '',
    role: 'student',
    opleidingId: '',
    actief: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
          Wachtwoord *
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          value={formData.password}
          onChange={handleChange}
          className="input-field mt-1"
          placeholder="Minimaal 8 karakters"
          minLength={8}
        />
        <p className="mt-1 text-sm text-gray-500">
          Minimaal 8 karakters. De gebruiker kan dit later wijzigen.
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

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1"
        >
          {isLoading ? 'Bezig...' : 'Gebruiker Aanmaken'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary flex-1"
        >
          Annuleren
        </button>
      </div>
    </form>
  )
}
