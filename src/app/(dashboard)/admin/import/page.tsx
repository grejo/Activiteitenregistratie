import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import ImportModule from './ImportModule'

export const metadata = {
  title: 'Data Import - Admin',
}

export default async function ImportPage() {
  const session = await auth()

  if (session?.user.role !== 'admin') {
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

      <ImportModule opleidingen={opleidingen} />
    </div>
  )
}
