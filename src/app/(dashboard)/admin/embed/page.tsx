import { auth, getBeheerdeOpleidingIds } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import EmbedSnippetPanel from './EmbedSnippetPanel'

export const metadata = {
  title: 'Embedcode prikbord - Admin',
}

export default async function AdminEmbedPage() {
  const session = await auth()
  if (
    !session?.user ||
    (session.user.role !== 'admin' && session.user.role !== 'superadmin')
  ) {
    redirect('/dashboard')
  }
  const beheerdeIds = await getBeheerdeOpleidingIds(session.user.id)
  const opleidingen = await prisma.opleiding.findMany({
    where: beheerdeIds ? { id: { in: beheerdeIds } } : { actief: true },
    orderBy: { naam: 'asc' },
    select: { id: true, naam: true },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Embedcode prikbord
        </h1>
        <p className="text-pxl-black-light mt-4">
          Kopieer onderstaande code in Blackboard om het prikbord van een opleiding te tonen.
        </p>
      </div>
      <EmbedSnippetPanel opleidingen={opleidingen} />
    </div>
  )
}
