import { auth } from '@/lib/auth'
import { signOut } from '@/lib/auth'

export default async function NoAccessPage() {
  const session = await auth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pxl-white to-pxl-gray-light p-4">
      <div className="bg-white rounded-lg shadow-pxl p-10 border-t-4 border-pxl-gold max-w-md w-full text-center">
        <div className="text-5xl mb-6">🔒</div>
        <h1 className="font-heading font-black text-2xl text-pxl-black mb-3">
          Geen toegang
        </h1>
        <p className="text-pxl-black-light mb-2">
          Je bent aangemeld als <strong>{session?.user?.email}</strong>, maar je account heeft nog geen toegang tot deze applicatie.
        </p>
        <p className="text-pxl-black-light mb-8">
          Neem contact op met de beheerder om toegang te krijgen.
        </p>
        <a
          href="mailto:support@pxl.be"
          className="inline-block bg-pxl-gold text-white font-semibold px-6 py-3 rounded-lg hover:bg-pxl-gold-dark transition-colors mb-4"
        >
          Beheerder contacteren
        </a>
        <div className="mt-4">
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Afmelden
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
