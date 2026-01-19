'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Bewijsstuk = {
  id: string
  type: string
  bestandsnaam: string
  bestandspad: string
  uploadedAt: string
}

type BewijsstukkenUploadProps = {
  activiteitId?: string
  inschrijvingId?: string
  bewijsstukken: Bewijsstuk[]
  canUpload?: boolean
  canDelete?: boolean
  onUpdate?: () => void
}

const typeLabels: Record<string, string> = {
  handtekeninglijst: 'Handtekeninglijst',
  foto_deelnemers: 'Foto deelnemers',
  extra_bijlage: 'Extra bijlage',
  certificaat: 'Certificaat',
  bewijs_deelname: 'Bewijs deelname',
}

export default function BewijsstukkenUpload({
  activiteitId,
  inschrijvingId,
  bewijsstukken,
  canUpload = true,
  canDelete = true,
  onUpdate,
}: BewijsstukkenUploadProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState('bewijs_deelname')
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', selectedType)

      if (activiteitId) {
        formData.append('activiteitId', activiteitId)
      } else if (inschrijvingId) {
        formData.append('inschrijvingId', inschrijvingId)
      }

      const response = await fetch('/api/bewijsstukken', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload mislukt')
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Refresh data
      if (onUpdate) {
        onUpdate()
      } else {
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload mislukt')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit bewijsstuk wilt verwijderen?')) return

    setDeleting(id)
    setError(null)

    try {
      const response = await fetch(`/api/bewijsstukken/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Verwijderen mislukt')
      }

      // Refresh data
      if (onUpdate) {
        onUpdate()
      } else {
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verwijderen mislukt')
    } finally {
      setDeleting(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return '🖼️'
    }
    if (ext === 'pdf') {
      return '📄'
    }
    return '📎'
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Upload Section */}
      {canUpload && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label htmlFor="bewijsstuk-type" className="block text-sm font-medium text-gray-700 mb-1">
                Type bewijsstuk
              </label>
              <select
                id="bewijsstuk-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-field w-full"
              >
                <option value="bewijs_deelname">Bewijs deelname</option>
                <option value="certificaat">Certificaat</option>
                <option value="foto_deelnemers">Foto</option>
                <option value="handtekeninglijst">Handtekeninglijst</option>
                <option value="extra_bijlage">Extra bijlage</option>
              </select>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-pxl-gold bg-yellow-50'
                : 'border-gray-300 hover:border-pxl-gold hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            {uploading ? (
              <div className="text-gray-500">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-pxl-gold border-t-transparent rounded-full mb-2" />
                <p>Bezig met uploaden...</p>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-2">📤</div>
                <p className="text-gray-600 font-medium">
                  Sleep een bestand hierheen of klik om te selecteren
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  JPG, PNG, GIF, WEBP of PDF (max 10MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bewijsstukken List */}
      {bewijsstukken.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">
            Geüploade bewijsstukken ({bewijsstukken.length})
          </h4>
          <div className="space-y-2">
            {bewijsstukken.map((bewijsstuk) => (
              <div
                key={bewijsstuk.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{getFileIcon(bewijsstuk.bestandsnaam)}</span>
                  <div className="min-w-0">
                    <a
                      href={bewijsstuk.bestandspad}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block"
                    >
                      {bewijsstuk.bestandsnaam}
                    </a>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{typeLabels[bewijsstuk.type] || bewijsstuk.type}</span>
                      <span>•</span>
                      <span>
                        {new Date(bewijsstuk.uploadedAt).toLocaleDateString('nl-BE', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <a
                    href={bewijsstuk.bestandspad}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Bekijken"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </a>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(bewijsstuk.id)}
                      disabled={deleting === bewijsstuk.id}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="Verwijderen"
                    >
                      {deleting === bewijsstuk.id ? (
                        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {bewijsstukken.length === 0 && !canUpload && (
        <div className="text-center py-6 text-gray-500">
          <div className="text-3xl mb-2">📁</div>
          <p>Geen bewijsstukken geüpload</p>
        </div>
      )}
    </div>
  )
}
