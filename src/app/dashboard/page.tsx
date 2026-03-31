import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const role = session.user.role

  if (role === 'admin') redirect('/admin')
  if (role === 'docent') redirect('/docent')
  if (role === 'student') redirect('/student')

  // Ingelogd maar geen gekende rol → geen toegang
  redirect('/no-access')
}
