'use client'

import { useState } from 'react'

export function AftekendocumentButton({
  activiteitId,
  studentId,
  label = '📄 Aftekendocument (PDF)',
}: {
  activiteitId: string
  studentId?: string
  label?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL('/api/generate-pdf', window.location.origin)
      url.searchParams.set('activiteitId', activiteitId)
      if (studentId) url.searchParams.set('studentId', studentId)

      const response = await fetch(url.toString())
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'PDF-generatie mislukt')
      }
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = 'aftekendocument.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex flex-col">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center px-3 py-1.5 border border-pxl-black text-pxl-black rounded hover:bg-pxl-black hover:text-white font-medium transition-colors disabled:opacity-50"
      >
        {loading ? 'PDF genereren…' : label}
      </button>
      {error && <span className="text-xs text-red-600 mt-1">{error}</span>}
    </div>
  )
}
