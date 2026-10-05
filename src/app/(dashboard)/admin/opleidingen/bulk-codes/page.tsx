import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BulkCodesModule from './BulkCodesModule'

export const metadata = {
  title: 'Opleidingscodes bulk bijwerken - Admin',
}

export default async function BulkCodesPage() {
  const session = await auth()

  if (session?.user.role !== 'superadmin') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/opleidingen" className="block text-sm text-pxl-gold hover:underline mb-2">
          ← Terug naar opleidingen
        </Link>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Opleidingscodes bulk bijwerken
        </h1>
        <p className="text-pxl-black-light mt-4 max-w-3xl">
          Upload een Excel-overzicht met opleidingen en hun opleidingscode (bv. het OLOD-overzicht
          van het departement, of een eenvoudige lijst met de kolommen <strong>Opleiding</strong> en{' '}
          <strong>Code</strong>). Deze codes bepalen bij het inloggen via SSO aan welke opleiding een
          student gekoppeld wordt. Je krijgt eerst een voorstel te zien; er wordt pas iets gewijzigd
          wanneer je op <em>Wijzigingen toepassen</em> klikt.
        </p>
      </div>

      <BulkCodesModule />
    </div>
  )
}
