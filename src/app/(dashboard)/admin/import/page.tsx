import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import ImportModule from './ImportModule'

export const metadata = {
  title: 'Data Import - Admin',
}

export default async function ImportPage() {
  const session = await auth()

  if (session?.user.role !== 'superadmin') {
    redirect('/dashboard')
  }

  const opleidingen = await prisma.opleiding.findMany({
    where: { actief: true },
    orderBy: { naam: 'asc' },
    select: { id: true, naam: true },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Historische Data Import
        </h1>
        <p className="text-pxl-black-light mt-4">
          Importeer studenten, docenten en activiteiten vanuit het Excel-archief.
          Voer de stappen in volgorde uit: eerst gebruikers, dan activiteiten.
        </p>
      </div>

      <div className="card">
        <h2 className="font-heading font-bold text-lg mb-2">Sjablonen downloaden</h2>
        <p className="text-sm text-gray-500 mb-4">
          Gebruik onderstaande Excel-sjablonen als startpunt. Elk sjabloon bevat een
          voorbeeldrij en een tweede tab met uitleg per kolom.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/admin/import/template?type=activiteiten"
            className="inline-flex items-center px-4 py-2 border border-pxl-gold text-pxl-gold rounded hover:bg-yellow-50 font-medium"
          >
            📄 Sjabloon activiteiten (.xlsx)
          </a>
          <a
            href="/api/admin/import/template?type=gebruikers"
            className="inline-flex items-center px-4 py-2 border border-pxl-gold text-pxl-gold rounded hover:bg-yellow-50 font-medium"
          >
            👥 Sjabloon gebruikers (.xlsx)
          </a>
        </div>
      </div>

      <ImportModule opleidingen={opleidingen} />
    </div>
  )
}
