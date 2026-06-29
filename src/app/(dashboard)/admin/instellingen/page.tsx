import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import InstellingenClient from './InstellingenClient'

export const metadata = { title: 'Instellingen - Admin' }

export default async function InstellingenPage() {
  const session = await auth()
  if (session?.user.role !== 'superadmin') redirect('/admin')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Instellingen</h1>
        <p className="text-gray-500 text-sm mt-1">Systeeminstellingen voor superadmins</p>
      </div>
      <InstellingenClient />
    </div>
  )
}
