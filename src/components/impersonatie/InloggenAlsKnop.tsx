'use client'

import { useState, useTransition } from 'react'

export default function InloggenAlsKnop({
  userId,
  naam,
  className = 'text-red-600 hover:text-red-800',
}: {
  userId: string
  naam: string
  className?: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const start = () => {
    if (!confirm(`Inloggen als ${naam}? Alles wat je daarna doet, gebeurt als deze gebruiker.`)) return
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/admin/inloggen-als', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Mislukt')
        return
      }
      // Volledige herlaadbeurt: geen gecachte gegevens van de vorige identiteit
      window.location.assign(data.redirect ?? '/dashboard')
    })
  }

  return (
    <>
      <button type="button" onClick={start} disabled={pending} className={`${className} disabled:opacity-50`}>
        {pending ? 'Bezig…' : 'Inloggen als'}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </>
  )
}
