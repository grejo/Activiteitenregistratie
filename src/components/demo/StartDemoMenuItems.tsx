'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface StartDemoMenuItemsProps {
  /** Klassen per menu-item, zodat desktop-dropdown en mobiel menu elk hun eigen stijl houden */
  itemClassName: string
  headingClassName: string
}

/** "Start demo"-keuzes als items binnen het gebruikersmenu van de navbar. */
export default function StartDemoMenuItems({ itemClassName, headingClassName }: StartDemoMenuItemsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
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
      router.push(data.redirect ?? '/dashboard')
      router.refresh()
    })
  }

  return (
    <>
      <div className={headingClassName}>🎬 Start demo{pending && ' …'}</div>
      <button
        type="button"
        role="menuitem"
        onClick={() => start('student')}
        disabled={pending}
        className={`w-full text-left disabled:opacity-50 ${itemClassName}`}
      >
        Als demo-student
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => start('docent')}
        disabled={pending}
        className={`w-full text-left disabled:opacity-50 ${itemClassName}`}
      >
        Als demo-docent
      </button>
      {error && <p className="px-4 py-2 text-xs text-red-400">{error}</p>}
    </>
  )
}
