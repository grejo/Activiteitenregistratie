import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Gebruikersbeheer - Admin',
}

async function getUsers() {
  return await prisma.user.findMany({
    include: {
      opleiding: true,
    },
    orderBy: [
      { actief: 'desc' },
      { role: 'asc' },
      { naam: 'asc' },
    ],
  })
}

export default async function UsersPage() {
  const session = await auth()

  if (session?.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const users = await getUsers()

  const roleLabels = {
    admin: 'Administrator',
    docent: 'Docent',
    student: 'Student',
  }

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    docent: 'bg-blue-100 text-blue-800',
    student: 'bg-green-100 text-green-800',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
            Gebruikersbeheer
          </h1>
          <p className="text-pxl-black-light mt-4">
            Beheer alle gebruikers in het systeem
          </p>
        </div>
        <Link href="/admin/users/new" className="btn-primary">
          ➕ Nieuwe Gebruiker
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Totaal Gebruikers</div>
          <div className="text-2xl font-bold text-pxl-gold">{users.length}</div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Admins</div>
          <div className="text-2xl font-bold text-red-600">
            {users.filter((u) => u.role === 'admin').length}
          </div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Docenten</div>
          <div className="text-2xl font-bold text-blue-600">
            {users.filter((u) => u.role === 'docent').length}
          </div>
        </div>
        <div className="card-flat">
          <div className="text-sm text-pxl-black-light">Studenten</div>
          <div className="text-2xl font-bold text-green-600">
            {users.filter((u) => u.role === 'student').length}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gebruiker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opleiding
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className={!user.actief ? 'opacity-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{user.naam}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        roleColors[user.role as keyof typeof roleColors]
                      }`}
                    >
                      {roleLabels[user.role as keyof typeof roleLabels]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.opleiding?.naam || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.actief
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.actief ? 'Actief' : 'Inactief'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-pxl-gold hover:text-pxl-gold-dark"
                    >
                      Bewerken
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
