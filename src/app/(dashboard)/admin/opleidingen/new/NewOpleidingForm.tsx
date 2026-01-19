'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewOpleidingForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    naam: '',
    code: '',
    beschrijving: '',
    actief: true,
    autoGoedkeuringStudentActiviteiten: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/opleidingen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is iets misgegaan')
      }

      router.push('/admin/opleidingen')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
          placeholder="Bv. Bouwkunde"
        />
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
          Code *
        </label>
        <input
          type="text"
          id="code"
          name="code"
          required
          value={formData.code}
          onChange={handleChange}
          className="input-field mt-1"
          placeholder="Bv. BOUW"
        />
        <p className="mt-1 text-sm text-gray-500">
          Unieke code voor de opleiding (meestal in hoofdletters)
        </p>
      </div>

      <div>
        <label
          htmlFor="beschrijving"
          className="block text-sm font-medium text-gray-700"
        >
          Beschrijving
        </label>
        <textarea
          id="beschrijving"
          name="beschrijving"
          value={formData.beschrijving}
          onChange={handleChange}
          className="input-field mt-1"
          rows={4}
          placeholder="Optionele beschrijving van de opleiding"
        />
      </div>

      <div className="space-y-4">
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
            Opleiding is actief
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoGoedkeuringStudentActiviteiten"
            name="autoGoedkeuringStudentActiviteiten"
            checked={formData.autoGoedkeuringStudentActiviteiten}
            onChange={handleChange}
            className="h-4 w-4 text-pxl-gold focus:ring-pxl-gold border-gray-300 rounded"
          />
          <label
            htmlFor="autoGoedkeuringStudentActiviteiten"
            className="ml-2 block text-sm text-gray-700"
          >
            Automatische goedkeuring van studentactiviteiten
          </label>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1"
        >
          {isLoading ? 'Bezig...' : 'Opleiding Aanmaken'}
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
