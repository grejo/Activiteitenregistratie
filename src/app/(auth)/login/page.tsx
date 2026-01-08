import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Inloggen - Activiteitenregistratie PXL',
}

export default async function LoginPage() {
  const session = await auth()

  // Als al ingelogd, redirect naar dashboard
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pxl-white to-pxl-gray-light">
      {/* Header */}
      <header className="bg-pxl-black text-pxl-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading font-black text-2xl text-pxl-white">
            Activiteitenregistratie
          </h1>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-pxl p-8 border-t-4 border-pxl-gold">
            <div className="text-center mb-8">
              <h2 className="font-heading font-black text-3xl text-pxl-black">
                Welkom terug
              </h2>
              <p className="text-pxl-black-light mt-2">
                Log in met je PXL account
              </p>
            </div>

            <Suspense fallback={<div className="text-center">Laden...</div>}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="text-center text-sm text-pxl-black-light mt-6">
            Problemen met inloggen?{' '}
            <a href="mailto:support@pxl.be" className="text-pxl-gold hover:underline">
              Neem contact op
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-pxl-black text-pxl-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} PXL Hogeschool
          </p>
        </div>
      </footer>
    </div>
  )
}
