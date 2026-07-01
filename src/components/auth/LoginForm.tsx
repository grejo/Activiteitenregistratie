'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

export function LoginForm() {
  // Altijd naar /dashboard sturen — die page stuurt op basis van rol door.
  const callbackUrl = '/dashboard'
  const [ssoLoading, setSsoLoading] = useState(false)

  const handleSsoLogin = async () => {
    setSsoLoading(true)
    await signIn('microsoft-entra-id', { callbackUrl })
  }

  return (
    <button
      type="button"
      onClick={handleSsoLogin}
      disabled={ssoLoading}
      className="w-full flex items-center justify-center gap-3 bg-pxl-black hover:bg-black text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23" aria-hidden="true">
        <path fill="#f3f3f3" d="M0 0h23v23H0z" />
        <path fill="#f35325" d="M1 1h10v10H1z" />
        <path fill="#81bc06" d="M12 1h10v10H12z" />
        <path fill="#05a6f0" d="M1 12h10v10H1z" />
        <path fill="#ffba08" d="M12 12h10v10H12z" />
      </svg>
      {ssoLoading ? 'Bezig…' : 'Inloggen met PXL-account'}
    </button>
  )
}
