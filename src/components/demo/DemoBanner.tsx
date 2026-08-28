'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  demoNaam: string
  demoRol: 'student' | 'docent'
}

export default function DemoBanner({ demoNaam, demoRol }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const doSwitch = (target: 'student' | 'docent') => {
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/demo/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: target }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Wisselen mislukt')
        return
      }
      router.push(data.redirect ?? '/dashboard')
      router.refresh()
    })
  }

  const doStop = (reset: boolean) => {
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/demo/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Demo stoppen mislukt')
        return
      }
      setShowStopDialog(false)
      router.push(data.redirect ?? '/dashboard')
      router.refresh()
    })
  }

  const anderRol: 'student' | 'docent' = demoRol === 'student' ? 'docent' : 'student'

  return (
    <>
      <div
        className="w-full bg-pxl-gold text-pxl-black border-b-2 border-pxl-black shadow-pxl"
        role="region"
        aria-label="Demo-modus"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span aria-hidden="true">🎬</span>
            <span>
              Demo-modus — je werkt als <strong>{demoNaam}</strong> ({demoRol}) in de{' '}
              <strong>Demo Opleiding</strong>. Ingevoerde data staat los van echte gegevens.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => doSwitch(anderRol)}
              disabled={pending}
              className="px-3 py-1 rounded bg-pxl-black text-pxl-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              Switch naar {anderRol}
            </button>
            <button
              type="button"
              onClick={() => setShowStopDialog(true)}
              disabled={pending}
              className="px-3 py-1 rounded bg-white text-pxl-black border border-pxl-black text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
            >
              Stop demo
            </button>
          </div>
        </div>
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {showStopDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-stop-title"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 id="demo-stop-title" className="text-xl font-bold mb-3">
              Demo stoppen
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              Je hebt tijdens deze demo mogelijk gegevens ingevoerd of gewijzigd.
              Wat wil je met de demo-gegevens doen?
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => doStop(false)}
                disabled={pending}
                className="w-full text-left px-4 py-3 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="font-semibold">Behouden</div>
                <div className="text-xs text-gray-600">
                  De volgende demo-sessie start met de huidige data — inclusief
                  wat je zonet hebt aangemaakt of gewijzigd.
                </div>
              </button>
              <button
                type="button"
                onClick={() => doStop(true)}
                disabled={pending}
                className="w-full text-left px-4 py-3 rounded border border-pxl-gold bg-yellow-50 hover:bg-yellow-100 disabled:opacity-50"
              >
                <div className="font-semibold">Resetten</div>
                <div className="text-xs text-gray-600">
                  Wis alle demo-data en zet de demo-omgeving terug op het
                  startpunt (originele demo-activiteiten en -inschrijvingen).
                </div>
              </button>
              <button
                type="button"
                onClick={() => setShowStopDialog(false)}
                disabled={pending}
                className="w-full text-center px-4 py-2 text-sm text-gray-600 hover:underline"
              >
                Annuleren
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          </div>
        </div>
      )}
    </>
  )
}
