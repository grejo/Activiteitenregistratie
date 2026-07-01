import { auth, getBeheerdeOpleidingIds } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import EditUserForm from './EditUserForm'

export const metadata = {
  title: 'Gebruiker Bewerken - Admin',
}

async function getUser(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      opleiding: true,
    },
  })
}

async function getOpleidingen(beheerdeIds: string[] | null) {
  return await prisma.opleiding.findMany({
    where: {
      actief: true,
      ...(beheerdeIds ? { id: { in: beheerdeIds } } : {}),
    },
    orderBy: { naam: 'asc' },
  })
}

async function getDocentOpleidingen(userId: string) {
  return await prisma.docentOpleiding.findMany({
    where: { docentId: userId },
    include: { opleiding: true },
    orderBy: { opleiding: { naam: 'asc' } },
  })
}

async function getAdminOpleidingIds(userId: string) {
  const rows = await prisma.adminOpleiding.findMany({
    where: { adminId: userId },
    select: { opleidingId: true },
  })
  return rows.map((r) => r.opleidingId)
}

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (session?.user.role !== 'admin' && session?.user.role !== 'superadmin') {
    redirect('/dashboard')
  }

  const { id } = await params
  const user = await getUser(id)

  if (!user) {
    notFound()
  }

  const beheerdeIds = await getBeheerdeOpleidingIds(session.user.id)
  const [opleidingen, docentOpleidingen, adminOpleidingIds] = await Promise.all([
    getOpleidingen(beheerdeIds),
    user.role === 'docent' ? getDocentOpleidingen(user.id) : Promise.resolve([]),
    user.role === 'admin' ? getAdminOpleidingIds(user.id) : Promise.resolve([]),
  ])
  const canAssignSuperadmin = session.user.role === 'superadmin'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
            Gebruiker Bewerken
          </h1>
          <p className="text-pxl-black-light mt-4">
            Bewerk de gegevens van {user.naam}
          </p>
        </div>
        {user.role === 'student' && (
          <Link
            href={`/admin/users/${user.id}/bekijk-als-student`}
            className="inline-flex items-center px-4 py-2 border border-pxl-gold text-pxl-gold rounded hover:bg-yellow-50 font-medium whitespace-nowrap"
          >
            👁️ Bekijk als student
          </Link>
        )}
      </div>

      {/* Form */}
      <div className="card max-w-2xl">
        <EditUserForm
          user={{
            ...user,
            gearchiveerdOp: user.gearchiveerdOp?.toISOString() ?? null,
          }}
          opleidingen={opleidingen}
          docentOpleidingen={docentOpleidingen.map((d) => ({
            opleidingId: d.opleidingId,
            naam: d.opleiding.naam,
          }))}
          adminOpleidingIds={adminOpleidingIds}
          canAssignSuperadmin={canAssignSuperadmin}
        />
      </div>
    </div>
  )
}
