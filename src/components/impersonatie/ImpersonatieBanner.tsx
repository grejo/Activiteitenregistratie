'use client'

import { useState, useTransition } from 'react'

type Props = {
  naam: string
  email: string
  rol: string
}

export default function ImpersonatieBanner({ naam, email, rol }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const stop = () => {
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/admin/inloggen-als/stop', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Terugkeren mislukt')
        return
      }
      // Volledige herlaadbeurt: geen gecachte gegevens van de vorige identiteit
      window.location.assign(data.redirect ?? '/dashboard')
    })
  }

  return (
    <div className="w-full bg-red-600 text-white border-b-2 border-red-800" role="region" aria-label="Ingelogd als andere gebruiker">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <strong>Ingelogd als {naam}</strong> ({rol}, {email}). Alles wat je nu doet, gebeurt
          als deze gebruiker.
          {error && <span className="ml-2 font-semibold">{error}</span>}
        </div>
        <button
          onClick={stop}
          disabled={pending}
          className="px-3 py-1.5 rounded bg-white text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-60"
        >
          {pending ? 'Bezig…' : 'Terug naar mijn account'}
        </button>
      </div>
    </div>
  )
}
