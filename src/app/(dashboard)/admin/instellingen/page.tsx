import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import InstellingenClient from './InstellingenClient'

export const metadata = { title: 'Instellingen - Admin' }

const beheerTools: Array<{
  href: string
  label: string
  icon: string
  omschrijving: string
}> = [
  {
    href: '/admin/import',
    label: 'Import',
    icon: '📥',
    omschrijving: 'Bulkimport van activiteiten en gebruikers uit Excel.',
  },
  {
    href: '/admin/opschoning',
    label: 'Opschoning',
    icon: '🧹',
    omschrijving: 'Archiveer oude gebruikers en ruim bestanden op.',
  },
  {
    href: '/admin/sjablonen',
    label: 'Sjablonen',
    icon: '📄',
    omschrijving: 'Beheer downloadbare sjablonen per opleiding.',
  },
  {
    href: '/admin/embed',
    label: 'Embed prikbord',
    icon: '🔗',
    omschrijving: 'Genereer iframe-code van het prikbord voor Blackboard.',
  },
]

export default async function InstellingenPage() {
  const session = await auth()
  if (session?.user.role !== 'superadmin') redirect('/admin')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-heading">Instellingen</h1>
        <p className="text-gray-500 text-sm mt-1">Systeeminstellingen voor superadmins</p>
      </div>

      <div>
        <h2 className="font-heading font-bold text-lg mb-3">Beheertools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {beheerTools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="card hover:border-pxl-gold transition-colors flex items-start gap-3"
            >
              <span className="text-2xl leading-none">{t.icon}</span>
              <div>
                <div className="font-semibold text-pxl-black">{t.label}</div>
                <div className="text-sm text-gray-500">{t.omschrijving}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-heading font-bold text-lg mb-3">Mail-instellingen</h2>
        <InstellingenClient />
      </div>
    </div>
  )
}
