'use client'

import { useState, useEffect } from 'react'

export default function InstellingenClient() {
  const [url, setUrl] = useState('')
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [testStatus, setTestStatus] = useState<'idle' | 'ok' | 'fout'>('idle')
  const [testFout, setTestFout] = useState('')

  useEffect(() => {
    fetch('/api/admin/instellingen')
      .then((r) => r.json())
      .then((d) => setUrl(d.url ?? ''))
  }, [])

  async function opslaan() {
    setBezig(true)
    setFout('')
    setOpgeslagen(false)
    const res = await fetch('/api/admin/instellingen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    setBezig(false)
    if (res.ok) {
      setOpgeslagen(true)
      setTimeout(() => setOpgeslagen(false), 3000)
    } else {
      const d = await res.json()
      setFout(d.error ?? 'Onbekende fout')
    }
  }

  async function testVersturen() {
    setTestStatus('idle')
    setTestFout('')
    const res = await fetch('/api/admin/instellingen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
    })
    if (res.ok) {
      setTestStatus('ok')
    } else {
      const d = await res.json()
      setTestStatus('fout')
      setTestFout(d.error ?? 'Onbekende fout')
    }
  }

  const actief = !!url.trim()

  return (
    <div className="max-w-2xl space-y-8">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">E-mailmeldingen — Power Automate</h2>
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded ${
              actief ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {actief ? 'Actief' : 'Uitgeschakeld'}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Plak de webhook-URL van je Power Automate-flow. Laat het veld leeg om mailing uit te schakelen.
        </p>

        <div className="space-y-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://prod-xx.westeurope.logic.azure.com/..."
            className="input w-full font-mono text-sm"
          />

          <div className="flex gap-2">
            <button
              onClick={opslaan}
              disabled={bezig}
              className="btn-primary"
            >
              {bezig ? 'Opslaan…' : 'Opslaan'}
            </button>
            <button
              onClick={testVersturen}
              disabled={!actief}
              className="btn-secondary"
            >
              Testbericht versturen
            </button>
          </div>

          {opgeslagen && (
            <p className="text-sm text-green-600 font-medium">Opgeslagen.</p>
          )}
          {fout && (
            <p className="text-sm text-red-600">{fout}</p>
          )}
          {testStatus === 'ok' && (
            <p className="text-sm text-green-600 font-medium">Testbericht verstuurd naar je e-mailadres.</p>
          )}
          {testStatus === 'fout' && (
            <p className="text-sm text-red-600">Testbericht mislukt: {testFout}</p>
          )}
        </div>
      </div>
    </div>
  )
}
