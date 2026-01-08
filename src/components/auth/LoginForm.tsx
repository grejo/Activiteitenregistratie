'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      }) as { error?: string } | undefined

      if (result?.error) {
        setError('Ongeldige email of wachtwoord')
        setIsLoading(false)
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError('Er is een fout opgetreden. Probeer het opnieuw.')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          placeholder="jouwnaam@pxl.be"
          required
          autoComplete="email"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          Wachtwoord
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Bezig met inloggen...
          </span>
        ) : (
          'Inloggen'
        )}
      </button>

      {/* Demo accounts info */}
      <div className="mt-8 p-4 bg-pxl-gray-light rounded-lg">
        <p className="text-sm font-semibold text-pxl-black mb-2">Demo accounts:</p>
        <div className="text-xs text-pxl-black-light space-y-1">
          <p><strong>Admin:</strong> admin@pxl.be / admin123</p>
          <p><strong>Docent:</strong> docent.bouw@pxl.be / docent123</p>
          <p><strong>Student:</strong> student.bouw@student.pxl.be / student123</p>
        </div>
      </div>
    </form>
  )
}
