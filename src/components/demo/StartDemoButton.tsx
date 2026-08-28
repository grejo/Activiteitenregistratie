'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function StartDemoButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = (role: 'student' | 'docent') => {
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/demo/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Demo starten mislukt')
        return
      }
      setOpen(false)
      router.push(data.redirect ?? '/dashboard')
      router.refresh()
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="px-3 py-1.5 rounded border border-pxl-gold bg-pxl-gold/10 text-pxl-black text-sm font-semibold hover:bg-pxl-gold/20 disabled:opacity-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        🎬 Start demo
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-56 rounded border border-gray-200 bg-white shadow-lg z-40"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => start('student')}
            disabled={pending}
            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Als demo-student
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => start('docent')}
            disabled={pending}
            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Als demo-docent
          </button>
          {error && <p className="px-3 py-2 text-xs text-red-700">{error}</p>}
        </div>
      )}
    </div>
  )
}
