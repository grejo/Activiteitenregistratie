'use client'

import { useMemo, useState } from 'react'

type Opleiding = { id: string; naam: string }

export default function EmbedSnippetPanel({ opleidingen }: { opleidingen: Opleiding[] }) {
  const [opleidingId, setOpleidingId] = useState('all')
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const embedUrl =
    opleidingId === 'all'
      ? `${origin}/embed/prikbord`
      : opleidingId
        ? `${origin}/embed/prikbord?opleidingId=${opleidingId}`
        : ''

  const snippet = useMemo(
    () =>
      embedUrl
        ? `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" style="border:1px solid #e5e7eb;border-radius:6px;"></iframe>`
        : '',
    [embedUrl]
  )

  const handleCopy = async () => {
    if (!snippet) return
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <label className="block text-sm font-medium text-gray-700">Opleiding</label>
        <select
          value={opleidingId}
          onChange={(e) => setOpleidingId(e.target.value)}
          className="input-field"
        >
          <option value="all">Alle opleidingen (departementaal)</option>
          {opleidingen.map((o) => (
            <option key={o.id} value={o.id}>{o.naam}</option>
          ))}
        </select>

        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">Directe URL</div>
          <input
            type="text"
            value={embedUrl}
            readOnly
            className="input-field w-full text-xs"
          />
        </div>

        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">Iframe-snippet</div>
          <textarea
            value={snippet}
            readOnly
            rows={4}
            className="input-field w-full font-mono text-xs"
          />
          <button
            onClick={handleCopy}
            disabled={!snippet}
            className="btn-primary mt-2"
          >
            {copied ? '✓ Gekopieerd' : '📋 Kopieer snippet'}
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="font-heading font-bold text-lg mb-2">Voorvertoning</h2>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            width="100%"
            height="500"
            style={{ border: '1px solid #e5e7eb', borderRadius: 6 }}
          />
        ) : (
          <p className="text-sm text-gray-500">Kies eerst een opleiding.</p>
        )}
      </div>
    </div>
  )
}
